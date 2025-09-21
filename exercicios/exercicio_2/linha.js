
function bresenham(x0, y0, x1, y1) {
    let points = [];
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1;
    let sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    while (true) {
        points.push([x0, y0]);
        if (x0 === x1 && y0 === y1) break;
        let e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
    }
    return points;
}





// --- WebGL Setup ---
const canvas = document.getElementById("tela");
const gl = canvas.getContext("webgl");





// Shaders
const vsSource = `
    attribute vec2 aPosition;
    void main(void) {
        gl_PointSize = 4.0;
        gl_Position = vec4(aPosition, 0.0, 1.0);
    }
`;
const fsSource = `
    void main(void) {
        gl_FragColor = vec4(1, 0, 0, 1); //escolhendo a cor vermelha da linha
    }
`;






function compileShader(src, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader));
    }
    return shader;
}

const vertexShader = compileShader(vsSource, gl.VERTEX_SHADER);
const fragmentShader = compileShader(fsSource, gl.FRAGMENT_SHADER);

const program = gl.createProgram();

gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

// --- Gerar pontos ---
const pontos = bresenham(10, 10, 150, 80);

// Normalizar coordenadas para [-1,1]
const width = canvas.width;
const height = canvas.height;
let vertices = [];
pontos.forEach(([x, y]) => {
    let nx = (x / width) * 2 - 1;
    let ny = (y / height) * -2 + 1;
    vertices.push(nx, ny);
});

// Criar buffer
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

// Conectar atributos
const aPosition = gl.getAttribLocation(program, "aPosition");
gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aPosition);

// Limpar e desenhar
gl.clearColor(1, 1, 1, 1);
gl.clear(gl.COLOR_BUFFER_BIT);

gl.drawArrays(gl.POINTS, 0, pontos.length);

