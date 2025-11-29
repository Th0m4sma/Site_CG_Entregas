const canvas = document.getElementById('meuCanvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    throw new Error('WebGL não suportado neste navegador');
}

let currentAngle = 0; 
let lastRotateTime = 0; 
const stepInterval = 500;
const rotationStep = Math.PI / 6; 

const vertexShaderSource = `
    attribute vec4 a_position;
    uniform mat4 u_matrix;
    void main() {
        gl_Position = u_matrix*a_position;
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
const matrixLocation = gl.getUniformLocation(program, 'u_matrix');
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.4, 0.7, 0.3, 1.0); 
gl.clear(gl.COLOR_BUFFER_BIT);

function createRotationMatrix(angleRadians)
{
    const c = Math.cos(angleRadians);
    const s = Math.sin(angleRadians);

    return new Float32Array(
        [
            c, s, 0 ,0,
            -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
}


function draw(time){

    if(time - lastRotateTime >= stepInterval){
        currentAngle += rotationStep;
        lastRotateTime = time;
    }
gl.clear(gl.COLOR_BUFFER_BIT);

const angle = currentAngle;
const rotationMatrix = createRotationMatrix(angle);
gl.uniformMatrix4fv(matrixLocation,false,rotationMatrix);


const numPetals = 16;
const petalOuterRadius = 0.6; 
const petalInnerRadius = 0.25; 
const petalWidthAngle = 0.25;  


gl.uniform4f(colorLocation, 1.0, 1.0, 1.0, 1.0); 

for (let i = 0; i < numPetals; i++) {
    const centerAngle = 2.0 * Math.PI * i / numPetals;

    const tipX = petalOuterRadius * Math.cos(centerAngle);
    const tipY = petalOuterRadius * Math.sin(centerAngle);

    const baseAngle1 = centerAngle - petalWidthAngle;
    const baseX1 = petalInnerRadius * Math.cos(baseAngle1);
    const baseY1 = petalInnerRadius * Math.sin(baseAngle1);

    const baseAngle2 = centerAngle + petalWidthAngle;
    const baseX2 = petalInnerRadius * Math.cos(baseAngle2);
    const baseY2 = petalInnerRadius * Math.sin(baseAngle2);

    const petalVertices = new Float32Array([
        tipX, tipY, baseX1, baseY1, baseX2, baseY2
    ]);

    gl.bufferData(gl.ARRAY_BUFFER, petalVertices, gl.STATIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

const circleVertices = [];
const numSegments = 30; 
const radius = 0.3;
circleVertices.push(0.0, 0.0);
for (let i = 0; i <= numSegments; i++) {
    const angle = 2.0 * Math.PI * i / numSegments;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    circleVertices.push(x, y);
}
const vertices = new Float32Array(circleVertices);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
gl.uniform4f(colorLocation, 1.0, 0.84, 0.0, 1.0); 
gl.drawArrays(gl.TRIANGLE_FAN, 0, numSegments + 2);

const circleVertices2 = [];
const numSegments2 = 30;
const radius2 = 0.1;
circleVertices2.push(0.0, 0.0);
for (let i = 0; i <= numSegments2; i++) {
    const angle = 2.0 * Math.PI * i / numSegments2;
    const x = radius2 * Math.cos(angle);
    const y = radius2 * Math.sin(angle);
    circleVertices2.push(x, y);
}
const vertices2 = new Float32Array(circleVertices2);
gl.bufferData(gl.ARRAY_BUFFER, vertices2, gl.STATIC_DRAW);
gl.uniform4f(colorLocation, 0.5, 0.25, 0.0, 1.0); 
gl.drawArrays(gl.TRIANGLE_FAN, 0, numSegments2 + 2);


requestAnimationFrame(draw);
}

requestAnimationFrame(draw);