// Vertex shader source code
const vertexShaderSourceFan = `
    attribute vec4 a_position;
    void main() {
        gl_Position = a_position;
    }
`;

// Fragment shader source code
const fragmentShaderSourceFan = `
    precision mediump float;
    void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); 
    }
`;

function createShaderFan(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Erro compilando shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgramFan(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Erro linkando programa:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}




function pentagonVertices(centerX, centerY) {
    const vertices = [];
    vertices.push(centerX, centerY); // centro do pentágono

    const radius = 0.15;
    const numSides = 18;

    for (let i = 0; i <= numSides; i++) {
        const angle = i * 2 * Math.PI / numSides;
        const x = centerX + radius * Math.cos(angle); 
        const y = centerY + radius * Math.sin(angle);
        vertices.push(x, y);
    }

    return new Float32Array(vertices);
}


function retanguloVertices() {
    return new Float32Array([
        // Primeiro triângulo
        -0.6,  -0.25,   // topo esquerdo
        0.6,  -0.25,   // topo direito
        0.6, -0.5,   // base direita

        // Segundo triângulo
        -0.6,  -0.25,   // topo esquerdo
        0.6, -0.5,   // base direita
        -0.6, -0.5    // base esquerda
    ]);
}

function mainFan() {
    const canvas = document.getElementById('glCanvasCarro');
    const gl = canvas.getContext('webgl');
    
    if (!gl) {
        console.error('WebGL não suportado');
        return;
    }
    
    const vertexShader = createShaderFan(gl, gl.VERTEX_SHADER, vertexShaderSourceFan);
    const fragmentShader = createShaderFan(gl, gl.FRAGMENT_SHADER, fragmentShaderSourceFan);
    const program = createProgramFan(gl, vertexShader, fragmentShader);
    gl.useProgram(program);
    
    const buffer = gl.createBuffer();
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Primeiro pentágono
    const vertices1 = pentagonVertices(-0.4, -0.7);
    gl.bufferData(gl.ARRAY_BUFFER, vertices1, gl.STATIC_DRAW);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices1.length / 2);

    // Segundo pentágono
    const vertices2 = pentagonVertices(0.4, -0.7);
    gl.bufferData(gl.ARRAY_BUFFER, vertices2, gl.STATIC_DRAW);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices2.length / 2);

    // Retângulo
    const vertices3 = retanguloVertices();
    gl.bufferData(gl.ARRAY_BUFFER, vertices3, gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

window.addEventListener('load', mainFan);
