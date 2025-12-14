// ========== MÓDULO DOS BASTÕES (PADDLES) ==========

// Posições dos bastões (exportar para colisão)
export const paddlePositions = {
    paddle1: { x: -1.7, z: 0 }, // Jogador humano
    paddle2: { x: 1.7, z: 0 },  // Oponente
    radius: 0.15 
};

// Função para criar os vértices de um cilindro 3D
function createCylinderVertices(radius, height, segments) {
    let vertices = [];
    let h = height / 2;
    
    for (let i = 0; i < segments; i++) {
        let angle1 = (i / segments) * Math.PI * 2;
        let angle2 = ((i + 1) / segments) * Math.PI * 2;
        
        let x1 = Math.cos(angle1) * radius;
        let z1 = Math.sin(angle1) * radius;
        let x2 = Math.cos(angle2) * radius;
        let z2 = Math.sin(angle2) * radius;
        
        // Tampa superior
        vertices.push(0, h, 0);
        vertices.push(x2, h, z2);
        vertices.push(x1, h, z1);
        
        // Tampa inferior
        vertices.push(0, -h, 0);
        vertices.push(x1, -h, z1);
        vertices.push(x2, -h, z2);
        
        // Laterais
        vertices.push(x1, h, z1);
        vertices.push(x2, h, z2);
        vertices.push(x1, -h, z1);
        
        vertices.push(x1, -h, z1);
        vertices.push(x2, h, z2);
        vertices.push(x2, -h, z2);
    }
    
    return vertices;
}

// Função para criar um bastão com base larga e cabo fino
function createCylindricVertices(baseRadius, baseHeight, handleRadius, handleHeight, segments) {
    let vertices = [];
    
    // Criar base (cilindro largo)
    let baseCylinder = createCylinderVertices(baseRadius, baseHeight, segments);
    for (let i = 0; i < baseCylinder.length; i++) {
        vertices.push(baseCylinder[i]);
    }
    
    // Criar cabo (cilindro fino em cima da base)
    let handleCylinder = createCylinderVertices(handleRadius, handleHeight, segments);
    let yOffset = (baseHeight + handleHeight) / 2;
    
    for (let i = 0; i < handleCylinder.length; i += 3) {
        vertices.push(
            handleCylinder[i], 
            handleCylinder[i + 1] + yOffset, 
            handleCylinder[i + 2]
        );
    }
    
    return new Float32Array(vertices);
}

// Função para criar cores para o bastão (base e cabo com cores diferentes)
function createCylindricColors(baseColor, handleColor, segments) {
    let colors = [];
    let baseVertices = segments * 12;
    let handleVertices = segments * 12;
    
    // Cor da base
    for (let i = 0; i < baseVertices; i++) {
        colors.push(baseColor[0], baseColor[1], baseColor[2]);
    }
    
    // Cor do cabo
    for (let i = 0; i < handleVertices; i++) {
        colors.push(handleColor[0], handleColor[1], handleColor[2]);
    }
    
    return new Float32Array(colors);
}

// Função para criar um objeto bastão completo
function createPaddle(baseRadius, baseHeight, handleRadius, handleHeight, segments, baseColor, handleColor) {
    const vertices = createCylindricVertices(baseRadius, baseHeight, handleRadius, handleHeight, segments);
    const colors = createCylindricColors(baseColor, handleColor, segments);
    return { vertices, colors };
}

// Exportar função para desenhar os bastões
export function drawPaddles(Matrix4, animationAngle, drawCylindricObject, gl, program) {
    const tempMatrix = new Matrix4();
    
    // Bastão do Jogador 1 Azul
    const paddle1 = createPaddle(0.10, 0.05, 0.03, 0.1, 24, [0.1, 0.3, 0.9], [0.3, 0.3, 0.3]);
    const paddle1Matrix = new Matrix4();
    paddle1Matrix.setIdentity();
    // Valores de paddlePositions
    paddle1Matrix.translate(paddlePositions.paddle1.x, 0.1, paddlePositions.paddle1.z);
    paddle1Matrix.scale(1.5, 1.5, 1.5);
    drawCylindricObject(paddle1, paddle1Matrix, gl, program);

    // Bastão do Jogador 2 Vermelho
    const paddle2 = createPaddle(0.10, 0.05, 0.03, 0.1, 24, [0.9, 0.1, 0.1], [0.3, 0.3, 0.3]);
    const paddle2Matrix = new Matrix4();
    paddle2Matrix.setIdentity();
    paddle2Matrix.translate(paddlePositions.paddle2.x, 0.1, paddlePositions.paddle2.z);
    paddle2Matrix.scale(1.5, 1.5, 1.5);
    drawCylindricObject(paddle2, paddle2Matrix, gl, program);
}

// Exportar função para desenhar objeto cilíndrico
export function drawCylindricObject(cylindricObject, matrix, gl, program) {
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cylindricObject.vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(program.a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.a_Position);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cylindricObject.colors, gl.STATIC_DRAW);
    gl.vertexAttribPointer(program.a_Color, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.a_Color);

    gl.uniformMatrix4fv(program.u_ModelMatrix, false, matrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, cylindricObject.vertices.length / 3);
}
