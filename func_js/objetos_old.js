// ========== ARQUIVO PRINCIPAL - IMPORTA TODOS OS OBJETOS ==========

// Importar módulos dos objetos
import { drawMinecraftCharacter } from './personagemModule.js';
import { drawPaddles, drawCylindricObject as drawCylindricObjectPaddle } from './bastao.js';
import { drawPuck, updatePuckPhysics } from './disco.js';
import { drawAirHockeyTable } from './mesaAirHockey.js';

// Variáveis globais
let gl;
let program;
let canvas;
let currentCamera = 0;
let animationAngle = 0;
let animationSpeed = 0.05;

// Matrizes
let modelMatrix;
let viewMatrix;
let projectionMatrix;

// Shaders
const vertexShaderSource = `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    varying vec4 v_Color;
    
    void main() {
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
        v_Color = a_Color;
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    varying vec4 v_Color;
    
    void main() {
        gl_FragColor = v_Color;
    }
`;

// Classe Matrix4 para operações de matriz
class Matrix4 {
    constructor() {
        this.elements = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
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

        e[0]  = ct / aspect;
        e[1]  = 0;
        e[2]  = 0;
        e[3]  = 0;

        e[4]  = 0;
        e[5]  = ct;
        e[6]  = 0;
        e[7]  = 0;

        e[8]  = 0;
        e[9]  = 0;
        e[10] = (far + near) * rn;
        e[11] = -1;

        e[12] = 0;
        e[13] = 0;
        e[14] = far * near * rn * 2;
        e[15] = 0;

        return this;
    }

    setLookAt(eyeX, eyeY, eyeZ, atX, atY, atZ, upX, upY, upZ) {
        const e = this.elements;
        let fx = atX - eyeX;
        let fy = atY - eyeY;
        let fz = atZ - eyeZ;

        const rl = 1 / Math.sqrt(fx * fx + fy * fy + fz * fz);
        fx *= rl;
        fy *= rl;
        fz *= rl;

        let sx = fy * upZ - fz * upY;
        let sy = fz * upX - fx * upZ;
        let sz = fx * upY - fy * upX;

        const rls = 1 / Math.sqrt(sx * sx + sy * sy + sz * sz);
        sx *= rls;
        sy *= rls;
        sz *= rls;

        const ux = sy * fz - sz * fy;
        const uy = sz * fx - sx * fz;
        const uz = sx * fy - sy * fx;

        e[0] = sx;
        e[1] = ux;
        e[2] = -fx;
        e[3] = 0;

        e[4] = sy;
        e[5] = uy;
        e[6] = -fy;
        e[7] = 0;

        e[8] = sz;
        e[9] = uz;
        e[10] = -fz;
        e[11] = 0;

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
        
        x /= len;
        y /= len;
        z /= len;

        const nc = 1 - c;
        const xy = x * y;
        const yz = y * z;
        const zx = z * x;
        const xs = x * s;
        const ys = y * s;
        const zs = z * s;

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
        for (let i = 0; i < 16; i++) {
            e[i] = s[i];
        }
        return this;
    }
}

// Inicialização
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

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    program.a_Position = gl.getAttribLocation(program, 'a_Position');
    program.a_Color = gl.getAttribLocation(program, 'a_Color');
    program.u_ModelMatrix = gl.getUniformLocation(program, 'u_ModelMatrix');
    program.u_ViewMatrix = gl.getUniformLocation(program, 'u_ViewMatrix');
    program.u_ProjectionMatrix = gl.getUniformLocation(program, 'u_ProjectionMatrix');
}

// Função para criar um cubo com cor
function createCube(r, g, b) {
    const vertices = new Float32Array([
        // Face frontal
        -0.5, -0.5,  0.5,   -0.5,  0.5,  0.5,    0.5,  0.5,  0.5,
        -0.5, -0.5,  0.5,    0.5,  0.5,  0.5,    0.5, -0.5,  0.5,
        // Face traseira
        -0.5, -0.5, -0.5,    0.5, -0.5, -0.5,    0.5,  0.5, -0.5,
        -0.5, -0.5, -0.5,    0.5,  0.5, -0.5,   -0.5,  0.5, -0.5,
        // Face superior
        -0.5,  0.5, -0.5,   -0.5,  0.5,  0.5,    0.5,  0.5,  0.5,
        -0.5,  0.5, -0.5,    0.5,  0.5,  0.5,    0.5,  0.5, -0.5,
        // Face inferior
        -0.5, -0.5, -0.5,    0.5, -0.5, -0.5,    0.5, -0.5,  0.5,
        -0.5, -0.5, -0.5,    0.5, -0.5,  0.5,   -0.5, -0.5,  0.5,
        // Face direita
         0.5, -0.5, -0.5,    0.5, -0.5,  0.5,    0.5,  0.5,  0.5,
         0.5, -0.5, -0.5,    0.5,  0.5,  0.5,    0.5,  0.5, -0.5,
        // Face esquerda
        -0.5, -0.5, -0.5,   -0.5,  0.5, -0.5,   -0.5,  0.5,  0.5,
        -0.5, -0.5, -0.5,   -0.5,  0.5,  0.5,   -0.5, -0.5,  0.5
    ]);

    // Cores variadas para cada face (efeito de iluminação)
    const colors = new Float32Array(36 * 3);
    const faceColors = [
        [r * 1.0, g * 1.0, b * 1.0],  // Frontal (mais claro)
        [r * 0.6, g * 0.6, b * 0.6],  // Traseira (escuro)
        [r * 0.9, g * 0.9, b * 0.9],  // Superior (claro)
        [r * 0.5, g * 0.5, b * 0.5],  // Inferior (escuro)
        [r * 0.8, g * 0.8, b * 0.8],  // Direita (médio)
        [r * 0.7, g * 0.7, b * 0.7]   // Esquerda (médio escuro)
    ];

    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
            const idx = (i * 6 + j) * 3;
            colors[idx] = faceColors[i][0];
            colors[idx + 1] = faceColors[i][1];
            colors[idx + 2] = faceColors[i][2];
        }
    }

    return { vertices, colors };
}

// Função para desenhar um cubo
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

    gl.uniformMatrix4fv(program.u_ModelMatrix, false, matrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

// Wrapper para desenhar objetos cilíndricos
function drawCylindricObject(cylindricObject, matrix) {
    drawCylindricObjectPaddle(cylindricObject, matrix, gl, program);
}

// Configurar câmeras
function setupCamera(cameraIndex) {
    
    // Sem rotação - personagem parado
    tempMatrix.setIdentity();
    
    // Cabeça (cubo maior, marrom - mesma cor dos braços)
    const headMatrix = new Matrix4();
    headMatrix.set(tempMatrix);
    headMatrix.translate(0, 1.5, 0);
    headMatrix.scale(0.8, 0.8, 0.8);
    const head = createCube(0.7, 0.5, 0.3);
    drawCube(head, headMatrix);

    // Olho esquerdo (preto)
    const leftEyeMatrix = new Matrix4();
    leftEyeMatrix.set(tempMatrix);
    leftEyeMatrix.translate(-0.15, 1.65, 0.41);
    leftEyeMatrix.scale(0.12, 0.12, 0.05);
    const leftEye = createCube(0.0, 0.0, 0.0);
    drawCube(leftEye, leftEyeMatrix);

    // Olho direito (preto)
    const rightEyeMatrix = new Matrix4();
    rightEyeMatrix.set(tempMatrix);
    rightEyeMatrix.translate(0.15, 1.65, 0.41);
    rightEyeMatrix.scale(0.12, 0.12, 0.05);
    const rightEye = createCube(0.0, 0.0, 0.0);
    drawCube(rightEye, rightEyeMatrix);

    // Boca (linha horizontal preta)
    const mouthMatrix = new Matrix4();
    mouthMatrix.set(tempMatrix);
    mouthMatrix.translate(0, 1.35, 0.41);
    mouthMatrix.scale(0.3, 0.06, 0.05);
    const mouth = createCube(0.0, 0.0, 0.0);
    drawCube(mouth, mouthMatrix);

    // Corpo (retângulo vertical, verde)
    const bodyMatrix = new Matrix4();
    bodyMatrix.set(tempMatrix);
    bodyMatrix.translate(0, 0.4, 0);
    bodyMatrix.scale(0.8, 1.2, 0.4);
    const body = createCube(0.2, 0.8, 0.3);
    drawCube(body, bodyMatrix);

    // Braço direito (marrom)
    const rightArmMatrix = new Matrix4();
    rightArmMatrix.set(tempMatrix);
    rightArmMatrix.translate(0.6, 0.6, 0);
    rightArmMatrix.translate(0, -0.4, 0);
    rightArmMatrix.scale(0.3, 0.9, 0.3);
    const rightArm = createCube(0.7, 0.5, 0.3);
    drawCube(rightArm, rightArmMatrix);

    // Braço esquerdo (marrom)
    const leftArmMatrix = new Matrix4();
    leftArmMatrix.set(tempMatrix);
    leftArmMatrix.translate(-0.6, 0.6, 0);
    leftArmMatrix.translate(0, -0.4, 0);
    leftArmMatrix.scale(0.3, 0.9, 0.3);
    const leftArm = createCube(0.7, 0.5, 0.3);
    drawCube(leftArm, leftArmMatrix);

    // Perna direita (azul escuro)
    const rightLegMatrix = new Matrix4();
    rightLegMatrix.set(tempMatrix);
    rightLegMatrix.translate(0.25, -0.3, 0);
    rightLegMatrix.translate(0, -0.5, 0);
    rightLegMatrix.scale(0.3, 0.9, 0.3);
    const rightLeg = createCube(0.2, 0.3, 0.7);
    drawCube(rightLeg, rightLegMatrix);

    // Perna esquerda (azul escuro)
    const leftLegMatrix = new Matrix4();
    leftLegMatrix.set(tempMatrix);
    leftLegMatrix.translate(-0.25, -0.3, 0);
    leftLegMatrix.translate(0, -0.5, 0);
    leftLegMatrix.scale(0.3, 0.9, 0.3);
    const leftLeg = createCube(0.2, 0.3, 0.7);
    drawCube(leftLeg, leftLegMatrix);
}

// ========== FUNÇÕES DO BASTÃO ==========

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

// Função para criar um bastão com base larga e cabo fino
function createCylindricVertices(baseRadius, baseHeight, handleRadius, handleHeight, segments) {
    let vertices = [];
    
    // Criar base (cilindro largo)
    let baseCylinder = createCylinderVertices(baseRadius, baseHeight, segments);
    for (let i = 0; i < baseCylinder.length; i++) {
        vertices.push(baseCylinder[i]);
    }
    
    // Criar cabo (cilindro fino em cima da base)
    let handleCylinder = createCylinderVertices(handleRadius, handleHeight, segments);
    let yOffset = (baseHeight + handleHeight) / 2;
    
    for (let i = 0; i < handleCylinder.length; i += 3) {
        vertices.push(
            handleCylinder[i], 
            handleCylinder[i + 1] + yOffset, 
            handleCylinder[i + 2]
        );
    }
    
    return new Float32Array(vertices);
}

// Função para criar cores para o bastão (base e cabo com cores diferentes)
function createCylindricColors(baseColor, handleColor, segments) {
    let colors = [];
    let baseVertices = segments * 12;
    let handleVertices = segments * 12;
    
    // Cor da base
    for (let i = 0; i < baseVertices; i++) {
        colors.push(baseColor[0], baseColor[1], baseColor[2]);
    }
    
    // Cor do cabo
    for (let i = 0; i < handleVertices; i++) {
        colors.push(handleColor[0], handleColor[1], handleColor[2]);
    }
    
    return new Float32Array(colors);
}

// Função para criar um objeto bastão completo
function createPaddle(baseRadius, baseHeight, handleRadius, handleHeight, segments, baseColor, handleColor) {
    const vertices = createCylindricVertices(baseRadius, baseHeight, handleRadius, handleHeight, segments);
    const colors = createCylindricColors(baseColor, handleColor, segments);
    return { vertices, colors };
}

// Função para desenhar um bastão
function drawCylindricObject(cylindricObject, matrix) {
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cylindricObject.vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(program.a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.a_Position);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cylindricObject.colors, gl.STATIC_DRAW);
    gl.vertexAttribPointer(program.a_Color, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.a_Color);

    gl.uniformMatrix4fv(program.u_ModelMatrix, false, matrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, cylindricObject.vertices.length / 3);
}

// ========== DESENHAR BASTÕES NA CENA ==========
function drawPaddles() {
    const tempMatrix = new Matrix4();
    tempMatrix.setIdentity();
    
    // Criar bastãos
    const paddle1 = createPaddle(0.10, 0.05, 0.03, 0.1, 24, [1, 0, 0], [0.3, 0.3, 0.3]);
    const paddle2 = createPaddle(0.10, 0.05, 0.03, 0.1, 24, [0, 0, 1], [0.3, 0.3, 0.3]);
    
    // Bastão à direita do personagem
    const paddle1Matrix = new Matrix4();
    paddle1Matrix.set(tempMatrix);
    paddle1Matrix.translate(2, 0.2, 0);
    paddle1Matrix.rotate(animationAngle * 50, 0, 1, 0);
    paddle1Matrix.scale(1.5, 1.5, 1.5);
    drawCylindricObject(paddle1, paddle1Matrix);
    
    // Bastão à esquerda do personagem
    const paddle2Matrix = new Matrix4();
    paddle2Matrix.set(tempMatrix);
    paddle2Matrix.translate(-2, 0.2, 0);
    paddle2Matrix.rotate(-animationAngle * 50, 0, 1, 0);
    paddle2Matrix.scale(1.5, 1.5, 1.5);
    drawCylindricObject(paddle2, paddle2Matrix);
}
// ========== FIM DAS FUNÇÕES DO BASTÃO ==========

// ========== FUNÇÕES DO DISCO ==========

// Função para criar o disco
function createPuck(radius, height, segments, r, g, b) {
    const vertices = createCylindricVertices(radius, height, 0, 0, segments);
    const colors = createCylindricColors([r, g, b], [r, g, b], segments);
    return { vertices, colors };
}

// Função para desenhar o disco
function drawPuck() {
    const tempMatrix = new Matrix4();
    tempMatrix.setIdentity();
    
    const disco = createPuck(0.05, 0.02, 24, 0, 1, 0);
    
    const discoMatrix = new Matrix4();
    discoMatrix.set(tempMatrix);
    discoMatrix.translate(puckX, 0.1, puckZ);
    discoMatrix.rotate(animationAngle * 100, 0, 1, 0);
    discoMatrix.scale(3, 3, 3);
    drawCylindricObject(disco, discoMatrix);
}

// Atualizar física do disco
function updatePuckPhysics() {
    // Atualizar posição
    puckX += puckVelocityX;
    puckZ += puckVelocityZ;

    // Verificar colisão com bordas laterais (esquerda/direita)
    if (puckX - puckScaledRadius <= tableMinX) {
        puckX = tableMinX + puckScaledRadius;
        puckVelocityX = Math.abs(puckVelocityX); // Inverte para direita
    } else if (puckX + puckScaledRadius >= tableMaxX) {
        puckX = tableMaxX - puckScaledRadius;
        puckVelocityX = -Math.abs(puckVelocityX); // Inverte para esquerda
    }

    // Verificar colisão com bordas superior/inferior
    if (puckZ - puckScaledRadius <= tableMinZ) {
        puckZ = tableMinZ + puckScaledRadius;
        puckVelocityZ = Math.abs(puckVelocityZ); // Inverte para cima
    } else if (puckZ + puckScaledRadius >= tableMaxZ) {
        puckZ = tableMaxZ - puckScaledRadius;
        puckVelocityZ = -Math.abs(puckVelocityZ); // Inverte para baixo
    }
}
// ========== FIM FUNÇÕES DO DISCO ==========

// ========== FUNÇÕES DA MESA DE AIR HOCKEY ==========

// Função para criar um cilindro (para círculo central e pernas da mesa)
function createCylinder(r, g, b, segments = 16) {
    const vertices = [];
    const colors = [];

    // Tampa superior
    for (let i = 0; i < segments; i++) {
        const angle1 = (i / segments) * Math.PI * 2;
        const angle2 = ((i + 1) / segments) * Math.PI * 2;
        
        vertices.push(0, 0.5, 0);
        vertices.push(Math.cos(angle1) * 0.5, 0.5, Math.sin(angle1) * 0.5);
        vertices.push(Math.cos(angle2) * 0.5, 0.5, Math.sin(angle2) * 0.5);
    }

    // Tampa inferior
    for (let i = 0; i < segments; i++) {
        const angle1 = (i / segments) * Math.PI * 2;
        const angle2 = ((i + 1) / segments) * Math.PI * 2;
        
        vertices.push(0, -0.5, 0);
        vertices.push(Math.cos(angle2) * 0.5, -0.5, Math.sin(angle2) * 0.5);
        vertices.push(Math.cos(angle1) * 0.5, -0.5, Math.sin(angle1) * 0.5);
    }

    // Lados
    for (let i = 0; i < segments; i++) {
        const angle1 = (i / segments) * Math.PI * 2;
        const angle2 = ((i + 1) / segments) * Math.PI * 2;
        
        const x1 = Math.cos(angle1) * 0.5;
        const z1 = Math.sin(angle1) * 0.5;
        const x2 = Math.cos(angle2) * 0.5;
        const z2 = Math.sin(angle2) * 0.5;

        vertices.push(x1, 0.5, z1);
        vertices.push(x1, -0.5, z1);
        vertices.push(x2, -0.5, z2);

        vertices.push(x1, 0.5, z1);
        vertices.push(x2, -0.5, z2);
        vertices.push(x2, 0.5, z2);
    }

    // Adicionar cores
    const totalVertices = vertices.length / 3;
    for (let i = 0; i < totalVertices; i++) {
        colors.push(r, g, b);
    }

    return {
        vertices: new Float32Array(vertices),
        colors: new Float32Array(colors),
        count: totalVertices
    };
}

// Função para desenhar um cilindro
function drawCylinder(cylinder, matrix) {
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cylinder.vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(program.a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.a_Position);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cylinder.colors, gl.STATIC_DRAW);
    gl.vertexAttribPointer(program.a_Color, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.a_Color);

    gl.uniformMatrix4fv(program.u_ModelMatrix, false, matrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, cylinder.count);
}

// Desenhar a mesa de air hockey
function drawAirHockeyTable() {
    const tempMatrix = new Matrix4();
    tempMatrix.setIdentity();

    // Superfície da mesa (azul claro com bordas)
    const tableTopMatrix = new Matrix4();
    tableTopMatrix.set(tempMatrix);
    tableTopMatrix.translate(0, 0, 0);
    tableTopMatrix.scale(4, 0.1, 2.5);
    const tableTop = createCube(0.2, 0.4, 0.8);
    drawCube(tableTop, tableTopMatrix);

    // Área de jogo (azul escuro - superfície interna)
    const playAreaMatrix = new Matrix4();
    playAreaMatrix.set(tempMatrix);
    playAreaMatrix.translate(0, 0.06, 0);
    playAreaMatrix.scale(3.6, 0.02, 2.2);
    const playArea = createCube(0.1, 0.2, 0.5);
    drawCube(playArea, playAreaMatrix);

    // Linha central (branca)
    const centerLineMatrix = new Matrix4();
    centerLineMatrix.set(tempMatrix);
    centerLineMatrix.translate(0, 0.08, 0);
    centerLineMatrix.scale(0.05, 0.01, 2.2);
    const centerLine = createCube(1.0, 1.0, 1.0);
    drawCube(centerLine, centerLineMatrix);

    // Círculo central (branco)
    const centerCircleMatrix = new Matrix4();
    centerCircleMatrix.set(tempMatrix);
    centerCircleMatrix.translate(0, 0.08, 0);
    centerCircleMatrix.scale(0.4, 0.01, 0.4);
    const centerCircle = createCylinder(1.0, 1.0, 1.0, 32);
    drawCylinder(centerCircle, centerCircleMatrix);

    // Gol esquerdo (vermelho)
    const leftGoalBackMatrix = new Matrix4();
    leftGoalBackMatrix.set(tempMatrix);
    leftGoalBackMatrix.translate(-1.95, 0.1, 0);
    leftGoalBackMatrix.scale(0.1, 0.20, 0.6);
    const leftGoalBack = createCube(0.8, 0.1, 0.1);
    drawCube(leftGoalBack, leftGoalBackMatrix);

    const leftGoalTopMatrix = new Matrix4();
    leftGoalTopMatrix.set(tempMatrix);
    leftGoalTopMatrix.translate(-1.90, 0.20, 0);
    leftGoalTopMatrix.scale(0.2, 0.05, 0.6);
    const leftGoalTop = createCube(0.8, 0.1, 0.1);
    drawCube(leftGoalTop, leftGoalTopMatrix);

    // Gol direito (vermelho)
    const rightGoalBackMatrix = new Matrix4();
    rightGoalBackMatrix.set(tempMatrix);
    rightGoalBackMatrix.translate(1.95, 0.1, 0);
    rightGoalBackMatrix.scale(0.1, 0.20, 0.6);
    const rightGoalBack = createCube(0.8, 0.1, 0.1);
    drawCube(rightGoalBack, rightGoalBackMatrix);

    const rightGoalTopMatrix = new Matrix4();
    rightGoalTopMatrix.set(tempMatrix);
    rightGoalTopMatrix.translate(1.90, 0.20, 0);
    rightGoalTopMatrix.scale(0.2, 0.05, 0.6);
    const rightGoalTop = createCube(0.8, 0.1, 0.1);
    drawCube(rightGoalTop, rightGoalTopMatrix);

    // Bordas laterais (brancas)
    const topBorderMatrix = new Matrix4();
    topBorderMatrix.set(tempMatrix);
    topBorderMatrix.translate(0, 0.1, 1.15);
    topBorderMatrix.scale(3.9, 0.15, 0.1);
    const topBorder = createCube(0.9, 0.9, 0.9);
    drawCube(topBorder, topBorderMatrix);

    const bottomBorderMatrix = new Matrix4();
    bottomBorderMatrix.set(tempMatrix);
    bottomBorderMatrix.translate(0, 0.1, -1.15);
    bottomBorderMatrix.scale(3.9, 0.15, 0.1);
    const bottomBorder = createCube(0.9, 0.9, 0.9);
    drawCube(bottomBorder, bottomBorderMatrix);

    // Bordas dos lados (brancas)
    const leftBorderTop = new Matrix4();
    leftBorderTop.set(tempMatrix);
    leftBorderTop.translate(-1.9, 0.1, 0.70);
    leftBorderTop.scale(0.1, 0.15, 0.8);
    const leftBorderTopCube = createCube(0.9, 0.9, 0.9);
    drawCube(leftBorderTopCube, leftBorderTop);

    const leftBorderBottom = new Matrix4();
    leftBorderBottom.set(tempMatrix);
    leftBorderBottom.translate(-1.9, 0.1, -0.70);
    leftBorderBottom.scale(0.1, 0.15, 0.8);
    const leftBorderBottomCube = createCube(0.9, 0.9, 0.9);
    drawCube(leftBorderBottomCube, leftBorderBottom);

    const rightBorderTop = new Matrix4();
    rightBorderTop.set(tempMatrix);
    rightBorderTop.translate(1.9, 0.1, 0.70);
    rightBorderTop.scale(0.1, 0.15, 0.8);
    const rightBorderTopCube = createCube(0.9, 0.9, 0.9);
    drawCube(rightBorderTopCube, rightBorderTop);

    const rightBorderBottom = new Matrix4();
    rightBorderBottom.set(tempMatrix);
    rightBorderBottom.translate(1.9, 0.1, -0.70);
    rightBorderBottom.scale(0.1, 0.15, 0.8);
    const rightBorderBottomCube = createCube(0.9, 0.9, 0.9);
    drawCube(rightBorderBottomCube, rightBorderBottom);

    // Pernas da mesa (4 cilindros marrons)
    const legPositions = [
        [-1.6, -0.45, 1.0],
        [1.6, -0.45, 1.0],
        [-1.6, -0.45, -1.0],
        [1.6, -0.45, -1.0]
    ];

    const leg = createCylinder(0.4, 0.3, 0.2, 16);
    
    for (let pos of legPositions) {
        const legMatrix = new Matrix4();
        legMatrix.set(tempMatrix);
        legMatrix.translate(pos[0], pos[1], pos[2]);
        legMatrix.scale(0.15, 0.8, 0.15);
        drawCylinder(leg, legMatrix);
    }
}

// ========== FIM FUNÇÕES DA MESA DE AIR HOCKEY ==========

// Configurar câmeras
function setupCamera(cameraIndex) {
    viewMatrix = new Matrix4();
    
    const cameraNames = [
        'Visão Geral',
        'Visão Frontal',
        'Visão Lateral',
        'Visão de Cima',
        'Visão Próxima'
    ];
    
    document.getElementById('camera-name').textContent = cameraNames[cameraIndex];
    
    switch(cameraIndex) {
        case 0: // Visão geral
            viewMatrix.setLookAt(5, 5, 8, 0, 0, 0, 0, 1, 0);
            break;
        case 1: // Frontal
            viewMatrix.setLookAt(0, 1, 6, 0, 0, 0, 0, 1, 0);
            break;
        case 2: // Lateral
            viewMatrix.setLookAt(6, 1, 0, 0, 0, 0, 0, 1, 0);
            break;
        case 3: // De cima
            viewMatrix.setLookAt(0, 8, 0.1, 0, 0, 0, 0, 0, -1);
            break;
        case 4: // Próxima
            viewMatrix.setLookAt(3, 2, 4, 0, 0, 0, 0, 1, 0);
            break;
    }
    
    gl.uniformMatrix4fv(program.u_ViewMatrix, false, viewMatrix.elements);
}

// Renderização
function render() {
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    updatePuckPhysics();
    setupCamera(currentCamera);
    drawAirHockeyTable();
    drawMinecraftCharacter();
    drawPaddles();
    drawPuck();

    animationAngle += animationSpeed;
    requestAnimationFrame(render);
}

// Controles de teclado
document.addEventListener('keydown', (e) => {
    if (e.key >= '1' && e.key <= '5') {
        currentCamera = parseInt(e.key) - 1;
    }
});

// Ajustar canvas quando redimensionar
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    projectionMatrix = new Matrix4();
    projectionMatrix.setPerspective(45, canvas.width / canvas.height, 0.1, 100);
    gl.uniformMatrix4fv(program.u_ProjectionMatrix, false, projectionMatrix.elements);
});

// Iniciar aplicação
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
