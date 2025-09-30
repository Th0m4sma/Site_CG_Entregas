const canvas = document.getElementById('meuCanvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    console.error('WebGL não suportado neste navegador');
    document.querySelector('.container').innerHTML = '<h1 class="title" style="color: #f87171;">Erro: WebGL não suportado neste navegador.</h1>';
    // return; // Não precisa de return aqui, pois o script vai parar de qualquer forma.
} else {

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

    // ADIÇÃO: É uma boa prática verificar se o programa foi linkado com sucesso
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Erro ao linkar o programa:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
    }

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const colorLocation = gl.getUniformLocation(program, 'u_color');
    const matrixLocation = gl.getUniformLocation(program, 'u_matrix');

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.5, 0.8, 1.0, 1.0); // Fundo azul claro
    gl.clear(gl.COLOR_BUFFER_BIT);

    function createMatrixRotation(angleRadians) {
        const s = Math.sin(angleRadians);
        const c = Math.cos(angleRadians);
        // Matriz de rotação em torno do eixo Z (para 2D)
        return new Float32Array([
            c, s, 0, 0,
            -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    // Variáveis de estado
    let currentAngle = 0;
    let lastRotateTime = 0;
    const stepInterval = 500; // Meio segundo por passo
    const rotationStep = Math.PI / 6; // Rotaciona 30 graus por passo

    function draw(time) {
        if (time - lastRotateTime >= stepInterval) {
            currentAngle += rotationStep;
            lastRotateTime = time;
        }

        gl.useProgram(program);

        gl.clear(gl.COLOR_BUFFER_BIT);

        const rotationMatrix = createMatrixRotation(currentAngle);
        gl.uniformMatrix4fv(matrixLocation, false, rotationMatrix);

        // --- Desenho do Pinwheel (4 Triângulos) ---

        // Triângulo 1 (Vermelho)
        let vertices = new Float32Array([
            0.0, 0.0,
            -0.7, 0.7,
            -0.7, 0.0
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.uniform4f(colorLocation, 1.0, 0.2, 0.2, 1.0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        // Triângulo 2 (Verde)
        vertices = new Float32Array([
            0.0, 0.0,
            0.7, 0.7,
            0.0, 0.7
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.uniform4f(colorLocation, 0.2, 1.0, 0.2, 1.0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        // Triângulo 3 (Amarelo)
        vertices = new Float32Array([
            0.0, 0.0,
            0.7, -0.7,
            0.7, 0.0
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.uniform4f(colorLocation, 1.0, 0.9, 0.2, 1.0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        // Triângulo 4 (Azul)
        vertices = new Float32Array([
            0.0, 0.0,
            -0.7, -0.7,
            0.0, -0.7
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.uniform4f(colorLocation, 0.2, 0.5, 1.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);


        // --- Desenho do Miolo Central ---
        const circleVertices = [];
        const numSegments = 30;
        const radius = 0.08;
        circleVertices.push(0.0, 0.0); // Ponto central
        for (let i = 0; i <= numSegments; i++) {
            const angle = 2.0 * Math.PI * i / numSegments;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            circleVertices.push(x, y);
        }
        const circleData = new Float32Array(circleVertices);
        gl.bufferData(gl.ARRAY_BUFFER, circleData, gl.STATIC_DRAW);
        gl.uniform4f(colorLocation, 0.3, 0.3, 0.3, 1.0); // Cinza escuro
        gl.drawArrays(gl.TRIANGLE_FAN, 0, numSegments + 2);

        requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
}
