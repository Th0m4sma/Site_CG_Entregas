// pinwheel.js
const vertexShaderSource = `
    attribute vec4 a_position;
    attribute vec4 a_color;
    varying vec4 v_color;

    void main() {
        gl_Position = a_position;
        v_color = a_color;
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    varying vec4 v_color;
    void main() {
        gl_FragColor = v_color;
    }
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Error linking program:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

function createPinwheelBlade(centerX, centerY, length, width, angle, color) {
    const vertices = [];
    
    // Converter ângulo para radianos
    const radAngle = angle * Math.PI / 180;
    
    // Calcular os pontos do triângulo (pá do catavento)
    const tipX = centerX + length * Math.cos(radAngle);
    const tipY = centerY + length * Math.sin(radAngle);
    
    const perpAngle = radAngle + Math.PI / 2;
    const base1X = centerX + width * Math.cos(perpAngle);
    const base1Y = centerY + width * Math.sin(perpAngle);
    
    const base2X = centerX - width * Math.cos(perpAngle);
    const base2Y = centerY - width * Math.sin(perpAngle);
    
    // Criar triângulo (2 triângulos para formar um losango)
    vertices.push(
        centerX, centerY,
        tipX, tipY,
        base1X, base1Y,
        
        centerX, centerY,
        tipX, tipY,
        base2X, base2Y
    );
    
    const colors = [];
    // Adicionar cores para cada vértice (6 vértices no total)
    for (let i = 0; i < 6; i++) {
        colors.push(...color);
    }
    
    return {
        vertices: new Float32Array(vertices),
        colors: new Float32Array(colors),
        vertexCount: 6
    };
}

function createPinwheelShaft(x, y, height, width, color) {
    const vertices = [
        x - width/2, y,
        x + width/2, y,
        x + width/2, y - height,
        x - width/2, y - height,
        x + width/2, y - height,
        x - width/2, y
    ];
    
    const colors = [];
    for (let i = 0; i < 6; i++) {
        colors.push(...color);
    }
    
    return {
        vertices: new Float32Array(vertices),
        colors: new Float32Array(colors),
        vertexCount: 6
    };
}

function createPinwheel() {
    const centerX = 0;
    const centerY = 0.3; // Centro mais alto
    const bladeLength = 0.4; // Pás maiores
    const bladeWidth = 0.12; // Pás mais largas
    const shaftHeight = 0.8; // Mastro mais longo
    const shaftWidth = 0.03; // Mastro mais largo
    
    const allVertices = [];
    const allColors = [];
    let totalVertices = 0;
    
    // Cores para as pás do catavento
    const bladeColors = [
        [1.0, 0.0, 0.0, 1.0], // Vermelho
        [0.0, 1.0, 0.0, 1.0], // Verde
        [0.0, 0.0, 1.0, 1.0], // Azul
        [1.0, 1.0, 0.0, 1.0]  // Amarelo
    ];
    
    // Criar 4 pás do catavento
    for (let i = 0; i < 4; i++) {
        const angle = i * 90;
        const blade = createPinwheelBlade(centerX, centerY, bladeLength, bladeWidth, angle, bladeColors[i]);
        allVertices.push(...blade.vertices);
        allColors.push(...blade.colors);
        totalVertices += blade.vertexCount;
    }
    
    // Criar mastro
    const shaft = createPinwheelShaft(centerX, centerY, shaftHeight, shaftWidth, [0.4, 0.2, 0.0, 1.0]);
    allVertices.push(...shaft.vertices);
    allColors.push(...shaft.colors);
    totalVertices += shaft.vertexCount;
    
    return {
        vertices: new Float32Array(allVertices),
        colors: new Float32Array(allColors),
        totalVertices: totalVertices
    };
}

function mainPinwheel() {
    const canvas = document.getElementById('glCanvasPinwheel');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        console.error('WebGL not supported');
        return;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);

    // Criar catavento
    const pinwheel = createPinwheel();

    // Configurar buffers de posição
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pinwheel.vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Configurar buffers de cor
    const colorLocation = gl.getAttribLocation(program, 'a_color');
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pinwheel.colors, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);


    // Desenhar o catavento
    gl.drawArrays(gl.TRIANGLES, 0, pinwheel.totalVertices);
}

window.addEventListener('load', mainPinwheel);
