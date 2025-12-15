// ========== MÓDULO DO DISCO (PUCK) ==========

// Variáveis do disco (puck)
export let puckState = {
    x: 0,
    z: 0,
    velocityX: 0.03,
    velocityZ: 0.02,
    scaledRadius: 0.15, // raio do disco após escala (0.05 * 3)

    // Sistema de delay
    isPaused: false,
    pauseTimeRemaining: 0,
    nextVelocityX: 0,
    nextVelocityZ: 0,

    // Sistema de pausa
    isGamePaused: false,
    savedVelocityX: 0,
    savedVelocityZ: 0,

    // Limites da mesa
    tableMinX: -1.8,
    tableMaxX: 1.8,
    tableMinZ: -1.1,
    tableMaxZ: 1.1
};

// Sistema de pontuação
export let scoreState = {
    player1: 0, 
    player2: 0  
};

export function resetPuck() {
    puckState.x = 0;
    puckState.z = 0;
    puckState.velocityX = 0;
    puckState.velocityZ = 0;

    // Pausar por 1 segundo
    puckState.isPaused = true;
    puckState.pauseTimeRemaining = 60;

    // Guardar a direção aleatória para quando o timer acabar
    const angle = (Math.random() - 0.5) * Math.PI / 2;
    const speed = 0.03;
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
        // Despausar
        puckState.velocityX = puckState.savedVelocityX;
        puckState.velocityZ = puckState.savedVelocityZ;
        puckState.isGamePaused = false;
    } else {
        // Pausar
        puckState.savedVelocityX = puckState.velocityX;
        puckState.savedVelocityZ = puckState.velocityZ;
        puckState.velocityX = 0;
        puckState.velocityZ = 0;
        puckState.isGamePaused = true;
    }
}

// Atualizar o placar na tela
function updateScoreDisplay() {
    const scorePlayer1 = document.getElementById('score-player1');
    const scorePlayer2 = document.getElementById('score-player2');

    if (scorePlayer1) {
        scorePlayer1.textContent = scoreState.player1;
    }
    if (scorePlayer2) {
        scorePlayer2.textContent = scoreState.player2;
    }

    // Verificar vitória
    checkWinCondition();
}

// Verificar condição de vitória
function checkWinCondition() {
    const urlParams = new URLSearchParams(window.location.search);
    const maxScore = parseInt(urlParams.get('maxScore')) || 5;
    const gameMode = urlParams.get('modo') || '1xBot';
    const isBotMode = gameMode === '1xBot';
    const player1Name = urlParams.get('player1') || 'Jogador 1';
    const player2Name = urlParams.get('player2') || (isBotMode ? 'Bot' : 'Jogador 2');

    if (maxScore === 999) return; // Sem limite

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

// Função para criar os vértices de um cilindro 3D
function createCylinderVertices(radius, height, segments) {
    let vertices = [];
    let h = height / 2;
    
    for (let i = 0; i < segments; i++) {
        let angle1 = (i / segments) * Math.PI * 2;
        let angle2 = ((i + 1) / segments) * Math.PI * 2;
        
        let x1 = Math.cos(angle1) * radius;
        let z1 = Math.sin(angle1) * radius;
        let x2 = Math.cos(angle2) * radius;
        let z2 = Math.sin(angle2) * radius;
        
        // Tampa superior
        vertices.push(0, h, 0);
        vertices.push(x2, h, z2);
        vertices.push(x1, h, z1);
        
        // Tampa inferior
        vertices.push(0, -h, 0);
        vertices.push(x1, -h, z1);
        vertices.push(x2, -h, z2);
        
        // Laterais
        vertices.push(x1, h, z1);
        vertices.push(x2, h, z2);
        vertices.push(x1, -h, z1);
        
        vertices.push(x1, -h, z1);
        vertices.push(x2, h, z2);
        vertices.push(x2, -h, z2);
    }
    
    return vertices;
}

// Função para criar cores cilíndricas
function createCylindricColors(baseColor, handleColor, segments) {
    let colors = [];
    let baseVertices = segments * 12;
    
    // Cor da base
    for (let i = 0; i < baseVertices; i++) {
        colors.push(baseColor[0], baseColor[1], baseColor[2]);
    }
    
    return new Float32Array(colors);
}

// Função para criar vértices cilíndricos
function createCylindricVertices(baseRadius, baseHeight, handleRadius, handleHeight, segments) {
    let vertices = [];
    
    // Criar base (cilindro largo)
    let baseCylinder = createCylinderVertices(baseRadius, baseHeight, segments);
    for (let i = 0; i < baseCylinder.length; i++) {
        vertices.push(baseCylinder[i]);
    }
    
    return new Float32Array(vertices);
}

// Função para criar o disco
function createPuck(radius, height, segments, r, g, b) {
    const vertices = createCylindricVertices(radius, height, 0, 0, segments);
    const colors = createCylindricColors([r, g, b], [r, g, b], segments);
    return { vertices, colors };
}

// Função para desenhar o disco
export function drawPuck(Matrix4, animationAngle, drawCylindricObject) {
    const tempMatrix = new Matrix4();
    tempMatrix.setIdentity();
    
    const disco = createPuck(0.05, 0.02, 24, 0, 1, 0);
    
    const discoMatrix = new Matrix4();
    discoMatrix.set(tempMatrix);
    discoMatrix.translate(puckState.x, 0.1, puckState.z);
    discoMatrix.rotate(animationAngle * 100, 0, 1, 0);
    discoMatrix.scale(3, 3, 3);
    drawCylindricObject(disco, discoMatrix);
}

// Atualizar física do disco
export function updatePuckPhysics(paddlePositions = null) {
    if (puckState.isGamePaused) {
        return;
    }

    // countdown após gol
    if (puckState.isPaused) {
        puckState.pauseTimeRemaining--;
        if (puckState.pauseTimeRemaining <= 0) {
            puckState.isPaused = false;
            puckState.velocityX = puckState.nextVelocityX;
            puckState.velocityZ = puckState.nextVelocityZ;
        }
        return;
    }

    // Atualizar posição
    puckState.x += puckState.velocityX;
    puckState.z += puckState.velocityZ;

    // Definir área do gol (centro da mesa)
    const goalZoneSize = 0.4;

    // Verificar colisão com bordas laterais (esquerda/direita) e GOLS
    if (puckState.x - puckState.scaledRadius <= puckState.tableMinX) {
        // Verificar se está na área do gol
        if (Math.abs(puckState.z) <= goalZoneSize) {
            // Jogador 2 marcou
            scoreState.player2++;
            updateScoreDisplay();
            resetPuck();
        } else {
            // Apenas rebate na borda
            puckState.x = puckState.tableMinX + puckState.scaledRadius;
            puckState.velocityX = Math.abs(puckState.velocityX); // Inverte para direita
        }
    } else if (puckState.x + puckState.scaledRadius >= puckState.tableMaxX) {
        // Verificar se está na área do gol
        if (Math.abs(puckState.z) <= goalZoneSize) {
            // Jogador 1 marcou
            scoreState.player1++;
            updateScoreDisplay();
            resetPuck();
        } else {
            // Apenas rebate na borda
            puckState.x = puckState.tableMaxX - puckState.scaledRadius;
            puckState.velocityX = -Math.abs(puckState.velocityX); // Inverte para esquerda
        }
    }

    // Verificar colisão com bordas superior/inferior
    if (puckState.z - puckState.scaledRadius <= puckState.tableMinZ) {
        puckState.z = puckState.tableMinZ + puckState.scaledRadius;
        puckState.velocityZ = Math.abs(puckState.velocityZ); // Inverte para cima
    } else if (puckState.z + puckState.scaledRadius >= puckState.tableMaxZ) {
        puckState.z = puckState.tableMaxZ - puckState.scaledRadius;
        puckState.velocityZ = -Math.abs(puckState.velocityZ); // Inverte para baixo
    }

    // Verificar colisão com os bastões (se fornecidos)
    if (paddlePositions) {
        // Colisão com bastão 1
        const dx1 = puckState.x - paddlePositions.paddle1.x;
        const dz1 = puckState.z - paddlePositions.paddle1.z;
        const distance1 = Math.sqrt(dx1 * dx1 + dz1 * dz1);
        const minDistance1 = puckState.scaledRadius + paddlePositions.radius;

        if (distance1 < minDistance1) {
            // Normalizar o vetor de colisão
            const nx = dx1 / distance1;
            const nz = dz1 / distance1;
            
            // Separar o disco do bastão
            puckState.x = paddlePositions.paddle1.x + nx * minDistance1;
            puckState.z = paddlePositions.paddle1.z + nz * minDistance1;
            
            // Calcular a reflexão da velocidade
            const dotProduct = puckState.velocityX * nx + puckState.velocityZ * nz;
            puckState.velocityX -= 2 * dotProduct * nx;
            puckState.velocityZ -= 2 * dotProduct * nz;
            
        }

        // Colisão com bastão 2
        const dx2 = puckState.x - paddlePositions.paddle2.x;
        const dz2 = puckState.z - paddlePositions.paddle2.z;
        const distance2 = Math.sqrt(dx2 * dx2 + dz2 * dz2);
        const minDistance2 = puckState.scaledRadius + paddlePositions.radius;

        if (distance2 < minDistance2) {
            // Normalizar o vetor de colisão
            const nx = dx2 / distance2;
            const nz = dz2 / distance2;
            
            // Separar o disco do bastão
            puckState.x = paddlePositions.paddle2.x + nx * minDistance2;
            puckState.z = paddlePositions.paddle2.z + nz * minDistance2;
            
            // Calcular a reflexão da velocidade
            const dotProduct = puckState.velocityX * nx + puckState.velocityZ * nz;
            puckState.velocityX -= 2 * dotProduct * nx;
            puckState.velocityZ -= 2 * dotProduct * nz;
            
        }
    }
}
