// ========== ARQUIVO PRINCIPAL - IMPORTA TODOS OS OBJETOS ==========

import { drawCylindricObject as drawCylindricObjectPaddle, drawPaddles, paddlePositions } from './bastao.js';
import { drawPuck, puckState, resetGame, resetPuck, togglePause, updatePuckPhysics } from './disco.js';
import { drawAirHockeyTable } from './mesaAirHockey.js';
import { drawMinecraftCharacter } from './Personagem.js';

// ========== CONFIGURAÇÕES DO JOGO ==========
const urlParams = new URLSearchParams(window.location.search);
const gameMode = urlParams.get('modo') || '1xBot';
const isBotMode = gameMode === '1xBot';
const player1Name = urlParams.get('player1') || 'Jogador 1';
const player2Name = urlParams.get('player2') || (isBotMode ? 'Bot' : 'Jogador 2');
const maxScore = parseInt(urlParams.get('maxScore')) || 5;

// Variáveis globais
let gl;
let program;
let canvas;
let currentCamera = 0;
let animationAngle = 0;
let animationSpeed = 0.05;

let keys = {};
const moveSpeed = 0.06;
const limitZ = 0.9; 

// IA
const aiConfig = {
    speed: 0.025,
    errorRange: 0.4,
    reactionDelay: 0.05,
    lastError: 0,
    puckHistory: [],
    latencyFrames: 12
};

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

let modelMatrix;
let viewMatrix;
let projectionMatrix;

// ==========================================
// 1. SHADERS ATUALIZADOS (MAIS BRILHO E REFLEXO)
// ==========================================

const vertexShaderSource = `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    attribute vec4 a_Normal; 
    
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    
    varying vec4 v_Color;
    varying vec3 v_Normal;
    varying vec3 v_Position;
    
    void main() {
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
        v_Position = vec3(u_ModelMatrix * a_Position);
        v_Normal = normalize(vec3(u_ModelMatrix * a_Normal));
        v_Color = a_Color;
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    varying vec4 v_Color;
    varying vec3 v_Normal;
    varying vec3 v_Position;
    
    void main() {
        vec3 normal = normalize(v_Normal);
        vec3 viewDir = normalize(-v_Position); 
        
        // --- POSIÇÃO DAS LUZES (PENDENTES NO TETO) ---
        // X= +/- 3.0, Y=14.0 (Teto)
        vec3 lightPos1 = vec3(-3.0, 14.0, 0.0); 
        vec3 lightColor1 = vec3(1.0, 0.95, 0.8); // Quente
        
        vec3 lightPos2 = vec3(3.0, 14.0, 0.0);
        vec3 lightColor2 = vec3(0.8, 0.9, 1.0); // Fria
        
        // --- 1. AMBIENTE MAIS FORTE (CORRIGE O "ESCURECIDO") ---
        vec3 ambientColor = vec3(0.5, 0.5, 0.5); 
        
        // --- CÁLCULO LUZ 1 ---
        vec3 lightDir1 = normalize(lightPos1 - v_Position);
        float diff1 = max(dot(normal, lightDir1), 0.0);
        vec3 diffuse1 = diff1 * lightColor1;
        
        // Reflexo Especular (Brilho Plástico)
        vec3 reflectDir1 = reflect(-lightDir1, normal);
        // "16.0" deixa o brilho maior/espalhado. "32.0" deixa pequeno/focado.
        float spec1 = pow(max(dot(viewDir, reflectDir1), 0.0), 16.0); 
        vec3 specular1 = 0.8 * spec1 * lightColor1; // 0.8 é a intensidade extra
        
        // --- CÁLCULO LUZ 2 ---
        vec3 lightDir2 = normalize(lightPos2 - v_Position);
        float diff2 = max(dot(normal, lightDir2), 0.0);
        vec3 diffuse2 = diff2 * lightColor2;
        
        vec3 reflectDir2 = reflect(-lightDir2, normal);
        float spec2 = pow(max(dot(viewDir, reflectDir2), 0.0), 16.0);
        vec3 specular2 = 0.8 * spec2 * lightColor2; 
        
        // Soma Tudo
        vec3 finalLight = ambientColor + (diffuse1 + specular1) + (diffuse2 + specular2);
        
        gl_FragColor = vec4(finalLight * v_Color.rgb, v_Color.a);
    }
`;

class Matrix4 {
    constructor() {
        this.elements = new Float32Array([
            1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1
        ]);
    }
    setIdentity() {
        const e = this.elements;
        e[0] = 1; e[4] = 0; e[8]  = 0; e[12] = 0;
        e[1] = 0; e[5] = 1; e[9]  = 0; e[13] = 0;
        e[2] = 0; e[6] = 0; e[10] = 1; e[14] = 0;
        e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1;
        return this;
    }
    setPerspective(fovy, aspect, near, far) {
        const e = this.elements;
        const rd = Math.PI / 180;
        const s = Math.sin(fovy * rd / 2);
        const ct = Math.cos(fovy * rd / 2) / s;
        const rn = 1 / (near - far);
        e[0]  = ct / aspect; e[1]  = 0; e[2]  = 0; e[3]  = 0;
        e[4]  = 0; e[5]  = ct; e[6]  = 0; e[7]  = 0;
        e[8]  = 0; e[9]  = 0; e[10] = (far + near) * rn; e[11] = -1;
        e[12] = 0; e[13] = 0; e[14] = far * near * rn * 2; e[15] = 0;
        return this;
    }
    setLookAt(eyeX, eyeY, eyeZ, atX, atY, atZ, upX, upY, upZ) {
        const e = this.elements;
        let fx = atX - eyeX; let fy = atY - eyeY; let fz = atZ - eyeZ;
        const rl = 1 / Math.sqrt(fx * fx + fy * fy + fz * fz);
        fx *= rl; fy *= rl; fz *= rl;
        let sx = fy * upZ - fz * upY; let sy = fz * upX - fx * upZ; let sz = fx * upY - fy * upX;
        const rls = 1 / Math.sqrt(sx * sx + sy * sy + sz * sz);
        sx *= rls; sy *= rls; sz *= rls;
        const ux = sy * fz - sz * fy; const uy = sz * fx - sx * fz; const uz = sx * fy - sy * fx;
        e[0] = sx; e[1] = ux; e[2] = -fx; e[3] = 0;
        e[4] = sy; e[5] = uy; e[6] = -fy; e[7] = 0;
        e[8] = sz; e[9] = uz; e[10] = -fz; e[11] = 0;
        e[12] = -(sx * eyeX + sy * eyeY + sz * eyeZ);
        e[13] = -(ux * eyeX + uy * eyeY + uz * eyeZ);
        e[14] = fx * eyeX + fy * eyeY + fz * eyeZ;
        e[15] = 1;
        return this;
    }
    translate(x, y, z) {
        const e = this.elements;
        e[12] += e[0] * x + e[4] * y + e[8]  * z;
        e[13] += e[1] * x + e[5] * y + e[9]  * z;
        e[14] += e[2] * x + e[6] * y + e[10] * z;
        e[15] += e[3] * x + e[7] * y + e[11] * z;
        return this;
    }
    rotate(angle, x, y, z) {
        const rad = Math.PI * angle / 180;
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        const len = Math.sqrt(x * x + y * y + z * z);
        x /= len; y /= len; z /= len;
        const nc = 1 - c;
        const xy = x * y; const yz = y * z; const zx = z * x;
        const xs = x * s; const ys = y * s; const zs = z * s;
        const rm = new Float32Array([
            x * x * nc + c,     xy * nc + zs,       zx * nc - ys,       0,
            xy * nc - zs,       y * y * nc + c,     yz * nc + xs,       0,
            zx * nc + ys,       yz * nc - xs,       z * z * nc + c,     0,
            0,                  0,                  0,                  1
        ]);
        return this.multiply(rm);
    }
    multiply(other) {
        const e = this.elements;
        const a = new Float32Array(e);
        const b = other instanceof Matrix4 ? other.elements : other;
        e[0]  = a[0] * b[0]  + a[4] * b[1]  + a[8]  * b[2]  + a[12] * b[3];
        e[1]  = a[1] * b[0]  + a[5] * b[1]  + a[9]  * b[2]  + a[13] * b[3];
        e[2]  = a[2] * b[0]  + a[6] * b[1]  + a[10] * b[2]  + a[14] * b[3];
        e[3]  = a[3] * b[0]  + a[7] * b[1]  + a[11] * b[2]  + a[15] * b[3];
        e[4]  = a[0] * b[4]  + a[4] * b[5]  + a[8]  * b[6]  + a[12] * b[7];
        e[5]  = a[1] * b[4]  + a[5] * b[5]  + a[9]  * b[6]  + a[13] * b[7];
        e[6]  = a[2] * b[4]  + a[6] * b[5]  + a[10] * b[6]  + a[14] * b[7];
        e[7]  = a[3] * b[4]  + a[7] * b[5]  + a[11] * b[6]  + a[15] * b[7];
        e[8]  = a[0] * b[8]  + a[4] * b[9]  + a[8]  * b[10] + a[12] * b[11];
        e[9]  = a[1] * b[8]  + a[5] * b[9]  + a[9]  * b[10] + a[13] * b[11];
        e[10] = a[2] * b[8]  + a[6] * b[9]  + a[10] * b[10] + a[14] * b[11];
        e[11] = a[3] * b[8]  + a[7] * b[9]  + a[11] * b[10] + a[15] * b[11];
        e[12] = a[0] * b[12] + a[4] * b[13] + a[8]  * b[14] + a[12] * b[15];
        e[13] = a[1] * b[12] + a[5] * b[13] + a[9]  * b[14] + a[13] * b[15];
        e[14] = a[2] * b[12] + a[6] * b[13] + a[10] * b[14] + a[14] * b[15];
        e[15] = a[3] * b[12] + a[7] * b[13] + a[11] * b[14] + a[15] * b[15];
        return this;
    }
    scale(sx, sy, sz) {
        const e = this.elements;
        e[0] *= sx;  e[4] *= sy;  e[8]  *= sz;
        e[1] *= sx;  e[5] *= sy;  e[9]  *= sz;
        e[2] *= sx;  e[6] *= sy;  e[10] *= sz;
        e[3] *= sx;  e[7] *= sy;  e[11] *= sz;
        return this;
    }
    set(other) {
        const e = this.elements;
        const s = other.elements;
        for (let i = 0; i < 16; i++) { e[i] = s[i]; }
        return this;
    }
}

function initWebGL() {
    canvas = document.getElementById('webgl-canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl = canvas.getContext('webgl');
    if (!gl) {
        alert('WebGL não está disponível no seu navegador!');
        return false;
    }
    return true;
}

function initShaders() {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(vertexShader));
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(fragmentShader));
    }

    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    program.a_Position = gl.getAttribLocation(program, 'a_Position');
    program.a_Color = gl.getAttribLocation(program, 'a_Color');
    program.a_Normal = gl.getAttribLocation(program, 'a_Normal');

    program.u_ModelMatrix = gl.getUniformLocation(program, 'u_ModelMatrix');
    program.u_ViewMatrix = gl.getUniformLocation(program, 'u_ViewMatrix');
    program.u_ProjectionMatrix = gl.getUniformLocation(program, 'u_ProjectionMatrix');
}

function createCube(r, g, b) {
    const vertices = new Float32Array([
        -0.5, -0.5,  0.5,   -0.5,  0.5,  0.5,    0.5,  0.5,  0.5,
        -0.5, -0.5,  0.5,    0.5,  0.5,  0.5,    0.5, -0.5,  0.5,
        -0.5, -0.5, -0.5,    0.5, -0.5, -0.5,    0.5,  0.5, -0.5,
        -0.5, -0.5, -0.5,    0.5,  0.5, -0.5,   -0.5,  0.5, -0.5,
        -0.5,  0.5, -0.5,   -0.5,  0.5,  0.5,    0.5,  0.5,  0.5,
        -0.5,  0.5, -0.5,    0.5,  0.5,  0.5,    0.5,  0.5, -0.5,
        -0.5, -0.5, -0.5,    0.5, -0.5, -0.5,    0.5, -0.5,  0.5,
        -0.5, -0.5, -0.5,    0.5, -0.5,  0.5,   -0.5, -0.5,  0.5,
         0.5, -0.5, -0.5,    0.5, -0.5,  0.5,    0.5,  0.5,  0.5,
         0.5, -0.5, -0.5,    0.5,  0.5,  0.5,    0.5,  0.5, -0.5,
        -0.5, -0.5, -0.5,   -0.5,  0.5, -0.5,   -0.5,  0.5,  0.5,
        -0.5, -0.5, -0.5,   -0.5,  0.5,  0.5,   -0.5, -0.5,  0.5
    ]);
    const normals = new Float32Array([
         0.0,  0.0,  1.0,    0.0,  0.0,  1.0,    0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,    0.0,  0.0,  1.0,    0.0,  0.0,  1.0,
         0.0,  0.0, -1.0,    0.0,  0.0, -1.0,    0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,    0.0,  0.0, -1.0,    0.0,  0.0, -1.0,
         0.0,  1.0,  0.0,    0.0,  1.0,  0.0,    0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,    0.0,  1.0,  0.0,    0.0,  1.0,  0.0,
         0.0, -1.0,  0.0,    0.0, -1.0,  0.0,    0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,    0.0, -1.0,  0.0,    0.0, -1.0,  0.0,
         1.0,  0.0,  0.0,    1.0,  0.0,  0.0,    1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,    1.0,  0.0,  0.0,    1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,   -1.0,  0.0,  0.0,   -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,   -1.0,  0.0,  0.0,   -1.0,  0.0,  0.0
    ]);
    const colors = new Float32Array(36 * 3);
    for (let i = 0; i < 36; i++) {
        colors[i*3] = r; colors[i*3+1] = g; colors[i*3+2] = b;
    }
    return { vertices, normals, colors };
}

function drawCube(cube, matrix) {
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cube.vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(program.a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.a_Position);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cube.colors, gl.STATIC_DRAW);
    gl.vertexAttribPointer(program.a_Color, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.a_Color);

    if (cube.normals && program.a_Normal !== -1) {
        const normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, cube.normals, gl.STATIC_DRAW);
        gl.vertexAttribPointer(program.a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(program.a_Normal);
    }
    gl.uniformMatrix4fv(program.u_ModelMatrix, false, matrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function drawCylindricObject(cylindricObject, matrix) {
    drawCylindricObjectPaddle(cylindricObject, matrix, gl, program);
}

function setupCamera(cameraIndex) {
    viewMatrix = new Matrix4();
    const cameraNames = ['Visão Geral', 'Visão Frontal', 'Visão Lateral', 'Visão de Cima', 'Visão Próxima'];
    document.getElementById('camera-name').textContent = cameraNames[cameraIndex];
    switch(cameraIndex) {
        case 0: viewMatrix.setLookAt(5, 5, 8, 0, 0, 0, 0, 1, 0); break;
        case 1: viewMatrix.setLookAt(0, 1, 6, 0, 0, 0, 0, 1, 0); break;
        case 2: viewMatrix.setLookAt(6, 1, 0, 0, 0, 0, 0, 1, 0); break;
        case 3: viewMatrix.setLookAt(-3.5, 12, 0, 0, 0, 0, 1, 0, 0); break;
        case 4: viewMatrix.setLookAt(-4.2, 2.5, 0, 1.0, 0.3, 0, 0, 1, 0); break;
    }
    gl.uniformMatrix4fv(program.u_ViewMatrix, false, viewMatrix.elements);
}

function handleMovement() {
    if (isBotMode) {
        if ((keys['a'] || keys['ArrowLeft']) && paddlePositions.paddle1.z > -limitZ) {
            paddlePositions.paddle1.z -= moveSpeed;
        }
        if ((keys['d'] || keys['ArrowRight']) && paddlePositions.paddle1.z < limitZ) {
            paddlePositions.paddle1.z += moveSpeed;
        }
    } else {
        if (keys['a'] && paddlePositions.paddle1.z > -limitZ) {
            paddlePositions.paddle1.z -= moveSpeed;
        }
        if (keys['d'] && paddlePositions.paddle1.z < limitZ) {
            paddlePositions.paddle1.z += moveSpeed;
        }
    }
    if (!isBotMode) {
        if (keys['ArrowRight'] && paddlePositions.paddle2.z > -limitZ) {
            paddlePositions.paddle2.z -= moveSpeed;
        }
        if (keys['ArrowLeft'] && paddlePositions.paddle2.z < limitZ) {
            paddlePositions.paddle2.z += moveSpeed;
        }
    }
}

function updateAI() {
    if (!isBotMode) return;
    aiConfig.puckHistory.push(puckState.z);
    if (aiConfig.puckHistory.length > aiConfig.latencyFrames) {
        aiConfig.puckHistory.shift();
    }
    let delayedTargetZ = aiConfig.puckHistory[0] || 0;
    let finalTarget;
    if (puckState.x < 0) {
        finalTarget = 0;
    } else {
        if (Math.random() < 0.02) {
            aiConfig.lastError = (Math.random() - 0.5) * aiConfig.errorRange;
        }
        finalTarget = delayedTargetZ + aiConfig.lastError;
    }
    let diff = finalTarget - paddlePositions.paddle2.z;
    if (Math.abs(diff) > aiConfig.speed) {
        paddlePositions.paddle2.z += Math.sign(diff) * aiConfig.speed;
    } else {
        paddlePositions.paddle2.z += diff * aiConfig.reactionDelay;
    }
    paddlePositions.paddle2.z = Math.max(-limitZ, Math.min(limitZ, paddlePositions.paddle2.z));
}

function render() {
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    setupCamera(currentCamera);

    handleMovement(); 
    updateAI();
    paddlePositions.paddle2.z = Math.max(-limitZ, Math.min(limitZ, paddlePositions.paddle2.z));
    updatePuckPhysics(paddlePositions);

    drawMinecraftCharacter(gl, program, Matrix4, createCube, drawCube, 
        paddlePositions.paddle1.z, false, currentCamera); 
    drawMinecraftCharacter(gl, program, Matrix4, createCube, drawCube, 
        paddlePositions.paddle2.z, true, currentCamera);

    drawPaddles(Matrix4, animationAngle, drawCylindricObjectPaddle, gl, program);
    
    drawAirHockeyTable(Matrix4, createCube, drawCube, gl, program, currentCamera);
    
    drawPuck(Matrix4, animationAngle, drawCylindricObject);

    animationAngle += animationSpeed;
    requestAnimationFrame(render);
}

document.addEventListener('keydown', (e) => {
    if (e.key >= '1' && e.key <= '5') currentCamera = parseInt(e.key) - 1;
    if (e.key === 'p' || e.key === 'P') togglePause();
    if (e.key === ' ') { e.preventDefault(); resetPuck(); }
    if (e.key === 'r' || e.key === 'R') resetGame();
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    projectionMatrix = new Matrix4();
    projectionMatrix.setPerspective(45, canvas.width / canvas.height, 0.1, 100);
    gl.uniformMatrix4fv(program.u_ProjectionMatrix, false, projectionMatrix.elements);
});

window.onload = function() {
    if (!initWebGL()) return;
    initShaders();
    gl.viewport(0, 0, canvas.width, canvas.height);
    projectionMatrix = new Matrix4();
    projectionMatrix.setPerspective(45, canvas.width / canvas.height, 0.1, 100);
    gl.uniformMatrix4fv(program.u_ProjectionMatrix, false, projectionMatrix.elements);
    modelMatrix = new Matrix4();
    modelMatrix.setIdentity();
    render();
};