const vertexShaderSourceFan = `
    attribute vec4 a_position;
    attribute vec4 a_color;
    varying vec4 v_color;

    void main() {
        gl_Position = a_position;
        v_color = a_color;
    }
`;

const fragmentShaderSourceFan = `
    precision mediump float;
    varying vec4 v_color;
    void main() {
        gl_FragColor = v_color;
    }
`;

function createShaderFan(gl, type, source) {
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

function createProgramFan(gl, vertexShader, fragmentShader) {
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

function makeCircle(cx, cy, radius, numSides, centerColor, edgeColor) {
    const vertices = [];
    const colors = [];

    // center
    vertices.push(cx, cy);
    colors.push(...centerColor);

    // outer ring
    for (let i = 0; i <= numSides; i++) {
        const angle = i * 2 * Math.PI / numSides;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        vertices.push(x, y);
        colors.push(...edgeColor);
    }

    return {
        vertices,
        colors,
    };
}

function setSquareVertices4(x,y,weight,height){
    return new Float32Array([
        x+0.4,y+height+0.05,
        x+weight+0.35,y+height+0.05,
        x+weight+0.35,y,
        x+0.4,y,
        x+weight+0.35,y,
        x+0.4,y+height+0.05
    ]);
}

function setSquareColors4() {
    const color = [0.0, 1.0, 0.0, 1.0]; // verde opaco RGBA
    const colorValues = [];
    for (let i = 0; i < 6; i++) {
        colorValues.push(...color);
    }
    return new Float32Array(colorValues);
}

function buildFlower(petalCount = 6, petalDistance = 0.7) {
    const allVertices = [];
    const allColors = [];

    const numSides = 60;
    const circleVertexCount = numSides + 2; // center + numSides + repeat

    // store vertex count separately since it's not a circle
    const stemVertexCount = 4;


    // petals
    for (let i = 0; i < petalCount; i++) {
        const angle = i * 2 * Math.PI / petalCount;
        const cx = petalDistance * Math.cos(angle);
        const cy = petalDistance * Math.sin(angle);

        let circle = makeCircle(cx, cy, 0.22, numSides,
            [1, 0.6, 0.8, 1],
            [1, 0.0, 0.0, 1]);

        allVertices.push(...circle.vertices);
        allColors.push(...circle.colors);
    }

    let circle = makeCircle(0, 0, 0.3, numSides,
        [1, 1, 1, 1],
        [1, 1, 0, 1]);
    allVertices.push(...circle.vertices);
    allColors.push(...circle.colors);

    return {
        vertices: new Float32Array(allVertices),
        colors: new Float32Array(allColors),
        circleVertexCount,
        totalCircles: 1 + petalCount,
        stemVertexCount
    };
}

function mainFan() {
    const canvas = document.getElementById('glCanvasFlower');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        console.error('WebGL not supported');
        return;
    }


    const vertexShader = createShaderFan(gl, gl.VERTEX_SHADER, vertexShaderSourceFan);
    const fragmentShader = createShaderFan(gl, gl.FRAGMENT_SHADER, fragmentShaderSourceFan);
    const program = createProgramFan(gl, vertexShader, fragmentShader);
    gl.useProgram(program);

    let { vertices, colors, circleVertexCount, totalCircles } = buildFlower(8, 0.5);

    // position buffer
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // color buffer
    const colorLocation = gl.getAttribLocation(program, 'a_color');
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);

    // clear screen
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // draw each circle separately
    for (let i = 0; i < totalCircles; i++) {
        const offset = i * circleVertexCount;
        gl.drawArrays(gl.TRIANGLE_FAN, offset, circleVertexCount);
    }
    
    // Desenhar o quadrado - CORREÇÃO AQUI
    vertices = setSquareVertices4(-0.5,-1,0.25,0.25);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    colors = setSquareColors4();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    // CORREÇÃO: mudar de 3 para 4 componentes (RGBA)
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

window.addEventListener('load', mainFan);
