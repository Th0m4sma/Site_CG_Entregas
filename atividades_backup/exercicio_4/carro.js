const canvas = document.getElementById('meuCanvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    document.querySelector('.container').innerHTML = '<h1 class="title" style="color: #f87171;">Erro: WebGL não suportado neste navegador.</h1>';
    throw new Error('WebGL não suportado');
}

// 1. ATUALIZAÇÃO DO SHADER: Adicionamos um 'uniform mat4 u_matrix' para receber a matriz de transformação.
const vertexShaderSource = `
    attribute vec4 a_position;
    uniform mat4 u_matrix;
    void main() {
        gl_Position = u_matrix * a_position;
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
// 2. PEGAR LOCALIZAÇÃO DA MATRIZ: Precisamos saber onde enviar os dados da matriz no shader.
const matrixLocation = gl.getUniformLocation(program, 'u_matrix');

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

gl.viewport(0, 0, canvas.width, canvas.height);

// 3. FUNÇÃO PARA CRIAR MATRIZ DE TRANSLAÇÃO: Esta função gera uma matriz que move um objeto.
function createMatrixTranslation(tx, ty, tz) {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        tx, ty, tz, 1
    ]);
}

// 4. VARIÁVEL DE ESTADO: Armazena a posição atual do carro no eixo X.
let carPositionX = -1.5; // Começa fora da tela, à esquerda.
const carSpeed = 0.005;

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

// 5. LOOP DE ANIMAÇÃO: Esta função é o coração da animação.
function animate() {
    // Atualiza a posição do carro
    carPositionX += carSpeed;

    // Se o carro sair da tela pela direita, ele volta para a esquerda
    if (carPositionX > 1.5) {
        carPositionX = -1.5;
    }

    // Limpa a tela
    gl.clearColor(0.5, 0.8, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Cria a matriz de translação com a nova posição do carro
    const moveMatrix = createMatrixTranslation(carPositionX, 0, 0);
    // Envia a matriz para o shader
    gl.uniformMatrix4fv(matrixLocation, false, moveMatrix);

    // --- Desenha o carro na nova posição ---

    // Chassi (corpo vermelho)
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

    // Cabine (corpo azul claro)
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

    // Rodas
    drawWheel(-0.5, -0.4);
    drawWheel(0.5, -0.4);

    // Solicita ao navegador para chamar 'animate' novamente no próximo quadro
    requestAnimationFrame(animate);
}

// Inicia a animação!
animate();