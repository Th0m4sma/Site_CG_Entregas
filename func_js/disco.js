// ========== MÓDULO DO DISCO (PUCK) ==========

let currentBaseSpeed = 0.03; 

export let puckState = {
    x: 0,
    z: 0,
    velocityX: 0.03,
    velocityZ: 0.03,
    scaledRadius: 0.15,
    isPaused: false,
    pauseTimeRemaining: 0,
    nextVelocityX: 0,
    nextVelocityZ: 0,
    isGamePaused: false,
    savedVelocityX: 0,
    savedVelocityZ: 0,
    tableMinX: -1.8,
    tableMaxX: 1.8,
    tableMinZ: -1.1,
    tableMaxZ: 1.1
};

export let scoreState = { player1: 0, player2: 0 };

export function resetPuck() {
    puckState.x = 0;
    puckState.z = 0;
    puckState.velocityX = 0;
    puckState.velocityZ = 0;
    puckState.isPaused = true;
    puckState.pauseTimeRemaining = 60;

    const angle = (Math.random() - 0.5) * Math.PI / 2;
    const speed = currentBaseSpeed; 
    
    puckState.nextVelocityX = Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1);
    puckState.nextVelocityZ = Math.sin(angle) * speed;
}

export function resetGame() {
    scoreState.player1 = 0;
    scoreState.player2 = 0;
    updateScoreDisplay();
    resetPuck();
}

export function togglePause() {
    if (puckState.isGamePaused) {
        puckState.velocityX = puckState.savedVelocityX;
        puckState.velocityZ = puckState.savedVelocityZ;
        puckState.isGamePaused = false;
    } else {
        puckState.savedVelocityX = puckState.velocityX;
        puckState.savedVelocityZ = puckState.velocityZ;
        puckState.velocityX = 0;
        puckState.velocityZ = 0;
        puckState.isGamePaused = true;
    }
}

function updateScoreDisplay() {
    const scorePlayer1 = document.getElementById('score-player1');
    const scorePlayer2 = document.getElementById('score-player2');
    if (scorePlayer1) scorePlayer1.textContent = scoreState.player1;
    if (scorePlayer2) scorePlayer2.textContent = scoreState.player2;
    checkWinCondition();
}

function checkWinCondition() {
    const urlParams = new URLSearchParams(window.location.search);
    const maxScore = parseInt(urlParams.get('maxScore')) || 5;
    const gameMode = urlParams.get('modo') || '1xBot';
    const isBotMode = gameMode === '1xBot';
    const player1Name = urlParams.get('player1') || 'Jogador 1';
    const player2Name = urlParams.get('player2') || (isBotMode ? 'Bot' : 'Jogador 2');

    if (maxScore === 999) return; 

    if (scoreState.player1 >= maxScore) {
        setTimeout(() => {
            alert(`🎉 ${player1Name} VENCEU! 🎉\n\nPlacar Final: ${scoreState.player1} x ${scoreState.player2}`);
            window.location.href = 'index.html';
        }, 100);
    } else if (scoreState.player2 >= maxScore) {
        setTimeout(() => {
            alert(`🎉 ${player2Name} VENCEU! 🎉\n\nPlacar Final: ${scoreState.player1} x ${scoreState.player2}`);
            window.location.href = 'index.html';
        }, 100);
    }
}

// --- GERAÇÃO DO DISCO COM NORMAIS ---
function createPuckData(radius, height, segments, r, g, b) {
    let vertices = [];
    let normals = [];
    let colors = [];
    let h = height / 2;

    // Função para adicionar triângulo
    function addTri(v1, v2, v3, n1, n2, n3) {
        vertices.push(...v1, ...v2, ...v3);
        normals.push(...n1, ...n2, ...n3);
        colors.push(r,g,b, r,g,b, r,g,b);
    }

    for (let i = 0; i < segments; i++) {
        let a1 = (i / segments) * Math.PI * 2;
        let a2 = ((i + 1) / segments) * Math.PI * 2;
        
        let x1 = Math.cos(a1) * radius;
        let z1 = Math.sin(a1) * radius;
        let x2 = Math.cos(a2) * radius;
        let z2 = Math.sin(a2) * radius;

        // Topo (Normal 0,1,0)
        addTri(
            [0, h, 0], [x2, h, z2], [x1, h, z1],
            [0,1,0], [0,1,0], [0,1,0]
        );

        // Fundo (Normal 0,-1,0)
        addTri(
            [0, -h, 0], [x1, -h, z1], [x2, -h, z2],
            [0,-1,0], [0,-1,0], [0,-1,0]
        );

        // Lateral
        // Normais laterais apontam para fora (x, 0, z)
        let n1 = [x1, 0, z1]; 
        let n2 = [x2, 0, z2];

        // Triangulo 1 Lateral
        addTri(
            [x1, h, z1], [x2, h, z2], [x1, -h, z1],
            n1, n2, n1
        );
        // Triangulo 2 Lateral
        addTri(
            [x1, -h, z1], [x2, h, z2], [x2, -h, z2],
            n1, n2, n2
        );
    }

    return {
        vertices: new Float32Array(vertices),
        normals: new Float32Array(normals),
        colors: new Float32Array(colors)
    };
}

export function drawPuck(Matrix4, animationAngle, drawCylindricObject) {
    const tempMatrix = new Matrix4();
    tempMatrix.setIdentity();
    
    // Cria o disco verde com normais corretas
    const disco = createPuckData(0.05, 0.02, 32, 0.0, 1.0, 0.0);
    
    const discoMatrix = new Matrix4();
    discoMatrix.set(tempMatrix);
    discoMatrix.translate(puckState.x, 0.1, puckState.z);
    discoMatrix.rotate(animationAngle * 100, 0, 1, 0);
    discoMatrix.scale(3, 3, 3);
    
    drawCylindricObject(disco, discoMatrix);
}

export function updatePuckPhysics(paddlePositions = null) {
    if (puckState.isGamePaused) return;

    if (puckState.isPaused) {
        puckState.pauseTimeRemaining--;
        if (puckState.pauseTimeRemaining <= 0) {
            puckState.isPaused = false;
            puckState.velocityX = puckState.nextVelocityX;
            puckState.velocityZ = puckState.nextVelocityZ;
        }
        return;
    }

    puckState.x += puckState.velocityX;
    puckState.z += puckState.velocityZ;

    const goalZoneSize = 0.4;

    if (puckState.x - puckState.scaledRadius <= puckState.tableMinX) {
        if (Math.abs(puckState.z) <= goalZoneSize) {
            scoreState.player2++;
            updateScoreDisplay();
            resetPuck();
        } else {
            puckState.x = puckState.tableMinX + puckState.scaledRadius;
            puckState.velocityX = Math.abs(puckState.velocityX); 
        }
    } else if (puckState.x + puckState.scaledRadius >= puckState.tableMaxX) {
        if (Math.abs(puckState.z) <= goalZoneSize) {
            scoreState.player1++;
            updateScoreDisplay();
            resetPuck();
        } else {
            puckState.x = puckState.tableMaxX - puckState.scaledRadius;
            puckState.velocityX = -Math.abs(puckState.velocityX); 
        }
    }

    if (puckState.z - puckState.scaledRadius <= puckState.tableMinZ) {
        puckState.z = puckState.tableMinZ + puckState.scaledRadius;
        puckState.velocityZ = Math.abs(puckState.velocityZ); 
    } else if (puckState.z + puckState.scaledRadius >= puckState.tableMaxZ) {
        puckState.z = puckState.tableMaxZ - puckState.scaledRadius;
        puckState.velocityZ = -Math.abs(puckState.velocityZ); 
    }

    if (paddlePositions) {
        const dx1 = puckState.x - paddlePositions.paddle1.x;
        const dz1 = puckState.z - paddlePositions.paddle1.z;
        const distance1 = Math.sqrt(dx1 * dx1 + dz1 * dz1);
        const minDistance1 = puckState.scaledRadius + paddlePositions.radius;

        if (distance1 < minDistance1) {
            const nx = dx1 / distance1;
            const nz = dz1 / distance1;
            puckState.x = paddlePositions.paddle1.x + nx * minDistance1;
            puckState.z = paddlePositions.paddle1.z + nz * minDistance1;
            const dotProduct = puckState.velocityX * nx + puckState.velocityZ * nz;
            puckState.velocityX -= 2 * dotProduct * nx;
            puckState.velocityZ -= 2 * dotProduct * nz;
        }

        const dx2 = puckState.x - paddlePositions.paddle2.x;
        const dz2 = puckState.z - paddlePositions.paddle2.z;
        const distance2 = Math.sqrt(dx2 * dx2 + dz2 * dz2);
        const minDistance2 = puckState.scaledRadius + paddlePositions.radius;

        if (distance2 < minDistance2) {
            const nx = dx2 / distance2;
            const nz = dz2 / distance2;
            puckState.x = paddlePositions.paddle2.x + nx * minDistance2;
            puckState.z = paddlePositions.paddle2.z + nz * minDistance2;
            const dotProduct = puckState.velocityX * nx + puckState.velocityZ * nz;
            puckState.velocityX -= 2 * dotProduct * nx;
            puckState.velocityZ -= 2 * dotProduct * nz;
        }
    }
}