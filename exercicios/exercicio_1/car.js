const canvas = document.getElementById('glCanvasCar');
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
    uniform vec4 u_color;
    void main() {
        gl_FragColor = u_color;
    }
`;

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
const colorLocation = gl.getUniformLocation(program, 'u_color');
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.5, 0.8, 1.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

let vertices = new Float32Array([
    -0.8, -0.4,
     0.8, -0.4,
    -0.8,  0.1,
    -0.8,  0.1,
     0.8, -0.4,
     0.8,  0.1
]);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
gl.uniform4f(colorLocation, 1.0, 0.2, 0.2, 1.0); 
gl.drawArrays(gl.TRIANGLES, 0, 6);

vertices = new Float32Array([
    -0.5, 0.1,
     0.4, 0.1,
    -0.5, 0.5,
    -0.5, 0.5,
     0.4, 0.1,
     0.2, 0.5
]);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
gl.uniform4f(colorLocation, 0.7, 0.9, 1.0, 1.0);
gl.drawArrays(gl.TRIANGLES, 0, 6);


function drawWheel(centerX, centerY) {
    const circleVertices = [];
    const numSegments = 30;
    const radius = 0.2;
    circleVertices.push(centerX, centerY);
    for (let i = 0; i <= numSegments; i++) {
        const angle = 2.0 * Math.PI * i / numSegments;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        circleVertices.push(x, y);
    }
    const circleData = new Float32Array(circleVertices);
    gl.bufferData(gl.ARRAY_BUFFER, circleData, gl.STATIC_DRAW);
    gl.uniform4f(colorLocation, 0.2, 0.2, 0.2, 1.0); 
    gl.drawArrays(gl.TRIANGLE_FAN, 0, numSegments + 2);
}

drawWheel(-0.5, -0.4);

drawWheel(0.5, -0.4);