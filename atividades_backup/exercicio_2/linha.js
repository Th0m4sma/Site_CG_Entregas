export function desenharLinha() {
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

    // Shaders
    const vertexShaderSource = `
    attribute vec2 a_position;
    uniform float u_pointSize;

    void main() {
        gl_Position = vec4(a_position, 0, 1);
        gl_PointSize = u_pointSize;
    }
    `;

    const fragmentShaderSource = `
    precision mediump float;
    uniform vec3 u_color;

    void main() {
        gl_FragColor = vec4(u_color,1.0);
    }
    `;

    function createShader1(gl, type, source) {
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

    function createProgram1(gl, vertexShader, fragmentShader) {
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


    // --- WebGL Setup ---
    const canvas = document.getElementById("tela");
    const gl = canvas.getContext("webgl");

    if (!gl) {
            console.error('WebGL not supported');
            return;
        }
        
    const vertexShader = createShader1(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader1(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = createProgram1(gl, vertexShader, fragmentShader);

    const VertexBuffer = gl.createBuffer();
    gl.useProgram(program);

    // --- Gerar pontos ---
    const pontos = bresenham(20, 20, 150, 150);

    // Normalizar coordenadas para [-1,1]
    const width = canvas.width;
    const height = canvas.height;
    let vertices = [];
    pontos.forEach(([x, y]) => {
        let nx = (x / width) * 2 - 1;
        let ny = (y / height) * -2 + 1;
        vertices.push(nx, ny);
    });

    const vertex = new Float32Array(vertices);
    gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertex, gl.STATIC_DRAW);


    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    let colorVector = [0.0,0.0,1.0];

    const colorUniformLocation = gl.getUniformLocation(program, 'u_color');
    gl.uniform3fv(colorUniformLocation,colorVector);

    let pointSize = 5.0; // valor inicial
    const pointSizeLocation = gl.getUniformLocation(program, 'u_pointSize');
    gl.uniform1f(pointSizeLocation, pointSize);

  
    const bodyElement = document.querySelector("body");
    bodyElement.addEventListener("keydown",keyDown,false);
  
    let esperandoCor = false; 
    let esperandoEspessura = false;

    function keyDown(event) {
        if (esperandoCor) {
            switch(event.key) {
                case '0':
                    colorVector = [0.5, 1.0, 0.5]; // verde claro
                    break;
                case '1':
                    colorVector = [1.0, 0.0, 0.0]; // vermelho
                    break;
                case '2':
                    colorVector = [0.0, 1.0, 0.0]; // verde
                    break;
                case '3':
                    colorVector = [0.0, 0.0, 1.0]; // azul
                    break;
                case '4':
                    colorVector = [0.0, 0.0, 0.0]; // preto
                    break;
                case '5':
                    colorVector = [1.0, 1.0, 0.8]; // branco
                    break;
                case '6':
                    colorVector = [1.0, 1.0, 0.0]; // amarelo
                    break;  
                case '7':
                    colorVector = [1.0, 0.0, 1.0]; // magenta
                    break;
                case '8':
                    colorVector = [0.0, 1.0, 1.0];
                    break; 
                case '9':
                    colorVector = [0.5, 0.5, 0.5];
                    break; 
            }
            esperandoCor = false; 
            gl.uniform3fv(colorUniformLocation, colorVector);
            drawPoint();

        }else if(esperandoEspessura){
            switch(event.key) {
                case '1': pointSize = 1.0; break;
                case '2': pointSize = 3.0; break;
                case '3': pointSize = 6.0; break;
                case '4': pointSize = 8.0; break;
                case '5': pointSize = 10.0; break;
                case '6': pointSize = 12.0; break;
                case '7': pointSize = 14.0; break;
                case '8': pointSize = 16.0; break;
                case '9': pointSize = 18.0; break;
                case '0': pointSize = 20.0; break;
            }      
            esperandoEspessura = false;
            gl.uniform1f(pointSizeLocation, pointSize);
            drawPoint();
        }else {
            // Verifica se ativou o modo de escolher cor
            if (event.key === 'k' || event.key === 'K') {
                esperandoCor = true;
                console.log('Pressione um valor para escolher a cor');
            }else if (event.key === 'e' || event.key === 'E') {
                esperandoEspessura = true;
                console.log('Pressione um valor para escolher a espessura');
            }
        }
    }

    function drawPoint(){
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, pontos.length);
    }

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawPoint();

}