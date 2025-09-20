const canvas = document.getElementById('glCanvasRobot');
const gl = canvas.getContext('webgl');

if (!gl) {
    throw new Error('WebGL não suportado neste navegador');
}

const vertexShaderSource = `
    attribute vec4 a_position;
    void main() {
        gl_Position = a_position;
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    uniform vec4 u_color; // Recebe a cor do JS
    void main() {
        gl_FragColor = u_color; // Usa a cor recebida
    }
`;

const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);


const colorLocation = gl.getUniformLocation(program, 'u_color');

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);


const positionLocation = gl.getAttribLocation(program, 'a_position');
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);


gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.9, 0.9, 0.9, 1.0); 
gl.clear(gl.COLOR_BUFFER_BIT);

const cabecaVertices = new Float32Array([
    -0.25, 0.6,  -0.25, 0.2,   0.25, 0.2,
    -0.25, 0.6,   0.25, 0.2,   0.25, 0.6,
]);
gl.bufferData(gl.ARRAY_BUFFER, cabecaVertices, gl.STATIC_DRAW);
gl.uniform4f(colorLocation, 0.5, 0.5, 0.5, 1.0);
gl.drawArrays(gl.TRIANGLES, 0, 6);



const corpoVertices = new Float32Array([
    -0.3, 0.2,  -0.3, -0.4,   0.3, -0.4,
    -0.3, 0.2,   0.3, -0.4,   0.3, 0.2,
]);
gl.bufferData(gl.ARRAY_BUFFER, corpoVertices, gl.STATIC_DRAW);

gl.uniform4f(colorLocation, 0.5, 0.5, 0.5, 1.0);

gl.drawArrays(gl.TRIANGLES, 0, 6);


const olhoEsqVertices = new Float32Array([
    -0.18, 0.45,  -0.18, 0.35,  -0.08, 0.35,
    -0.18, 0.45,  -0.08, 0.35,  -0.08, 0.45,
]);
gl.bufferData(gl.ARRAY_BUFFER, olhoEsqVertices, gl.STATIC_DRAW);
// Define a cor para PRETO (R=0, G=0, B=0, A=1)
gl.uniform4f(colorLocation, 0.0, 0.0, 0.0, 1.0);
// Desenha o olho (6 vértices)
gl.drawArrays(gl.TRIANGLES, 0, 6);

const olhosDirVertices = new Float32Array(
    [
        0.08, 0.45, 0.08, 0.35, 0.18, 0.45,
        0.18, 0.45, 0.18, 0.35, 0.08, 0.35
    ]
);

gl.bufferData(gl.ARRAY_BUFFER, olhosDirVertices, gl.STATIC_DRAW);
gl.uniform4f(colorLocation, 0.0, 0.0, 0.0, 1.0);
gl.drawArrays(gl.TRIANGLES,0,6);

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