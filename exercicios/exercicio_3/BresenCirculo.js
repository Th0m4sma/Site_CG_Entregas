const canvas = document.getElementById('meuCanvas');
const gl = canvas.getContext('webgl');
if (!gl) throw new Error('WebGL não suportado neste navegador');

const vertexShaderSource = `
attribute vec4 a_position;
uniform float u_thickness; 
void main() {
    gl_Position = a_position;
    gl_PointSize = 2.0;
}`;

const fragmentShaderSource = `
precision mediump float;
uniform vec4 u_color;
void main() {
    gl_FragColor = u_color;
}`;

function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Erro ao compilar shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

const positionLocation = gl.getAttribLocation(program, 'a_position');
const colorLocation = gl.getUniformLocation(program, 'u_color'); // corrigi aqui
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.95, 0.95, 0.95, 1.0);

// Paletas
const colorPalette = [
    [1.0, 0.0, 0.0, 1.0],
    [0.0, 1.0, 0.0, 1.0],
    [0.0, 0.0, 1.0, 1.0],
    [1.0, 1.0, 0.0, 1.0],
    [1.0, 0.0, 1.0, 1.0],
    [0.0, 1.0, 1.0, 1.0],
    [1.0, 0.5, 0.0, 1.0],
    [0.5, 0.0, 1.0, 1.0],
    [0.0, 0.0, 0.0, 1.0],
    [0.5, 0.5, 0.5, 1.0]
];
const expessuraPalette = [2,4,6,8,10,12,14,16,18];

let currentVertices = [];
let currentColor = colorPalette[2]; // azul inicial
let currentThickness = expessuraPalette[0];

function bresenhamCircle(centerX, centerY, radius) {
    const vertices = [];
    const cx = Math.round((centerX + 1) * canvas.width / 2);
    const cy = Math.round((-centerY + 1) * canvas.height / 2);

    let x = 0;
    let y = radius;
    let d = 3 - 2 * radius;

    while (y >= x) {
        plotCirclePoints(vertices, cx, cy, x, y);
        x++;
        if (d > 0) {
            y--;
            d = d + 4 * (x - y) + 10;
        } else {
            d = d + 4 * x + 6;
        }
    }
    return vertices;
}

function plotCirclePoints(vertices, cx, cy, x, y) {
    const pts = [
        [cx + x, cy + y],
        [cx - x, cy + y],
        [cx + x, cy - y],
        [cx - x, cy - y],
        [cx + y, cy + x],
        [cx - y, cy + x],
        [cx + y, cy - x],
        [cx - y, cy - x]
    ];
    pts.forEach(([px, py]) => {
        const webglX = (px / canvas.width) * 2 - 1;
        const webglY = (py / canvas.height) * -2 + 1;
        vertices.push(webglX, webglY);
    });
}

function drawShape() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform4fv(colorLocation, currentColor);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(currentVertices), gl.STATIC_DRAW);
    gl.drawArrays(gl.POINTS, 0, currentVertices.length / 2);
}

// desenha círculo inicial no centro
currentVertices = bresenhamCircle(0, 0, 50);
drawShape();

// desenha círculo no clique do mouse
canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const webglX = (mouseX / canvas.width) * 2 - 1;
    const webglY = (mouseY / canvas.height) * -2 + 1;

    currentVertices = bresenhamCircle(webglX, webglY, 50); // raio fixo 50 pixels
    drawShape();
});
