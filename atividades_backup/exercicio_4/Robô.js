const canvas = document.getElementById('glCanvasRobot');
const gl = canvas.getContext('webgl');
if (!gl) throw new Error('WebGL não suportado neste navegador');

function resizeCanvasToDisplaySize(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        return true;
    }
    return false;
}

const vertexShaderSource = `
    attribute vec4 a_position;
    void main() {
        gl_Position = a_position;
    }
`;
const fragmentShaderSource = `
    precision mediump float;
    uniform vec4 u_color;
    void main() {
        gl_FragColor = u_color;
    }
`;

function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const ok = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!ok) {
        const info = gl.getShaderInfoLog(shader);
        console.error('Erro ao compilar shader:', info);
        gl.deleteShader(shader);
        throw new Error('Erro ao compilar shader: ' + info);
    }
    return shader;
}

const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    console.error('Erro ao linkar programa:', info);
    throw new Error('Erro ao linkar programa: ' + info);
}
gl.useProgram(program);

const colorLocation = gl.getUniformLocation(program, 'u_color');
const positionLocation = gl.getAttribLocation(program, 'a_position');

const buffer = gl.createBuffer();

function drawTriangles(vertices, color) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform4f(colorLocation, color[0], color[1], color[2], color[3]);
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
}

resizeCanvasToDisplaySize(canvas);
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.9, 0.9, 0.9, 1.0);

function desenhaRobo(angleDeg) {
   
    resizeCanvasToDisplaySize(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clear(gl.COLOR_BUFFER_BIT);

    const cabeca = new Float32Array([
        -0.25, 0.6,  -0.25, 0.2,   0.25, 0.2,
        -0.25, 0.6,   0.25, 0.2,   0.25, 0.6,
    ]);
    drawTriangles(cabeca, [0.5, 0.5, 0.5, 1.0]);

    const corpo = new Float32Array([
        -0.3, 0.2,  -0.3, -0.4,   0.3, -0.4,
        -0.3, 0.2,   0.3, -0.4,   0.3, 0.2,
    ]);
    drawTriangles(corpo, [0.5, 0.5, 0.5, 1.0]);

    const olhoEsq = new Float32Array([
        -0.18, 0.45,  -0.18, 0.35,  -0.08, 0.35,
        -0.18, 0.45,  -0.08, 0.35,  -0.08, 0.45,
    ]);
    drawTriangles(olhoEsq, [0, 0, 0, 1]);

    const olhoDir = new Float32Array([
        0.08, 0.45,  0.08, 0.35,  0.18, 0.35,
        0.08, 0.45,  0.18, 0.35,  0.18, 0.45,
    ]);
    drawTriangles(olhoDir, [0, 0, 0, 1]);

    const rad = angleDeg * Math.PI / 180;
    const ampBraco = 0.08;
    const ampPerna = 0.06;
    const dyBraco = Math.sin(rad) * ampBraco;
    const dyPerna = Math.sin(rad) * ampPerna;

    const bracoEsq = new Float32Array([
        -0.45, 0.15 + dyBraco,  -0.45, -0.25 + dyBraco,  -0.3, -0.25 + dyBraco,
        -0.45, 0.15 + dyBraco,  -0.3, -0.25 + dyBraco,   -0.3, 0.15 + dyBraco
    ]);
    drawTriangles(bracoEsq, [0.6, 0.6, 0.6, 1]);

    const bracoDir = new Float32Array([
         0.3, 0.15 - dyBraco,   0.3, -0.25 - dyBraco,   0.45, -0.25 - dyBraco,
         0.3, 0.15 - dyBraco,   0.45, -0.25 - dyBraco,  0.45, 0.15 - dyBraco
    ]);
    drawTriangles(bracoDir, [0.6, 0.6, 0.6, 1]);

    const pernaEsq = new Float32Array([
        -0.2, -0.4 - dyPerna,  -0.2, -0.7 - dyPerna,   -0.05, -0.7 - dyPerna,
        -0.2, -0.4 - dyPerna,  -0.05, -0.7 - dyPerna,  -0.05, -0.4 - dyPerna
    ]);
    drawTriangles(pernaEsq, [0.4, 0.4, 0.4, 1]);

     const pernaDir = new Float32Array([
         0.05, -0.4 + dyPerna,   0.05, -0.7 + dyPerna,   0.2, -0.7 + dyPerna,
         0.05, -0.4 + dyPerna,   0.2, -0.7 + dyPerna,    0.2, -0.4 + dyPerna
    ]);
    drawTriangles(pernaDir, [0.4, 0.4, 0.4, 1]);
}

let angulos = [-60, -30, 0, 30, 60, 30, 0];
let i = 0;

setInterval(() => {
    desenhaRobo(angulos[i]);
    i = (i + 1) % angulos.length;
}, 150); // troca de frame a cada 150ms

