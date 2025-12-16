// ========== MÓDULO DOS BASTÕES (PADDLES) ==========

export const paddlePositions = {
    paddle1: { x: -1.7, z: 0 },
    paddle2: { x: 1.7, z: 0 }, 
    radius: 0.15 
};

// Função auxiliar para gerar vértices e normais de cilindro
function createCylinderData(radius, height, segments) {
    let vertices = [];
    let normals = [];
    let h = height / 2;
    
    // Tampa Superior
    for (let i = 0; i < segments; i++) {
        let angle1 = (i / segments) * Math.PI * 2;
        let angle2 = ((i + 1) / segments) * Math.PI * 2;
        
        let x1 = Math.cos(angle1) * radius;
        let z1 = Math.sin(angle1) * radius;
        let x2 = Math.cos(angle2) * radius;
        let z2 = Math.sin(angle2) * radius;
        
        vertices.push(0, h, 0);
        vertices.push(x2, h, z2);
        vertices.push(x1, h, z1);

        // Normal pra cima
        normals.push(0, 1, 0,  0, 1, 0,  0, 1, 0);
    }
    
    // Tampa Inferior
    for (let i = 0; i < segments; i++) {
        let angle1 = (i / segments) * Math.PI * 2;
        let angle2 = ((i + 1) / segments) * Math.PI * 2;
        
        let x1 = Math.cos(angle1) * radius;
        let z1 = Math.sin(angle1) * radius;
        let x2 = Math.cos(angle2) * radius;
        let z2 = Math.sin(angle2) * radius;

        vertices.push(0, -h, 0);
        vertices.push(x1, -h, z1);
        vertices.push(x2, -h, z2);

        // Normal pra baixo
        normals.push(0, -1, 0,  0, -1, 0,  0, -1, 0);
    }
    
    // Laterais
    for (let i = 0; i < segments; i++) {
        let angle1 = (i / segments) * Math.PI * 2;
        let angle2 = ((i + 1) / segments) * Math.PI * 2;
        
        let x1 = Math.cos(angle1) * radius;
        let z1 = Math.sin(angle1) * radius;
        let x2 = Math.cos(angle2) * radius;
        let z2 = Math.sin(angle2) * radius;
        
        vertices.push(x1, h, z1);
        vertices.push(x2, h, z2);
        vertices.push(x1, -h, z1);
        
        vertices.push(x1, -h, z1);
        vertices.push(x2, h, z2);
        vertices.push(x2, -h, z2);

        // Normais laterais (apontam para fora)
        normals.push(x1, 0, z1,  x2, 0, z2,  x1, 0, z1);
        normals.push(x1, 0, z1,  x2, 0, z2,  x2, 0, z2);
    }
    
    return { vertices, normals };
}

// Cria geometria completa do bastão (base + cabo)
function createPaddle(baseRadius, baseHeight, handleRadius, handleHeight, segments, baseColor, handleColor) {
    let finalVertices = [];
    let finalNormals = [];
    let finalColors = [];

    // 1. Criar Base
    const base = createCylinderData(baseRadius, baseHeight, segments);
    for(let v of base.vertices) finalVertices.push(v);
    for(let n of base.normals) finalNormals.push(n);
    
    // Cor da base
    const baseVertCount = base.vertices.length / 3;
    for(let i=0; i<baseVertCount; i++) finalColors.push(...baseColor);

    // 2. Criar Cabo (com offset Y)
    const handle = createCylinderData(handleRadius, handleHeight, segments);
    const yOffset = (baseHeight + handleHeight) / 2;
    
    for(let i=0; i<handle.vertices.length; i+=3) {
        finalVertices.push(handle.vertices[i], handle.vertices[i+1] + yOffset, handle.vertices[i+2]);
    }
    for(let n of handle.normals) finalNormals.push(n);

    // Cor do cabo
    const handleVertCount = handle.vertices.length / 3;
    for(let i=0; i<handleVertCount; i++) finalColors.push(...handleColor);

    return { 
        vertices: new Float32Array(finalVertices), 
        normals: new Float32Array(finalNormals),
        colors: new Float32Array(finalColors) 
    };
}

export function drawPaddles(Matrix4, animationAngle, drawCylindricObject, gl, program) {
    // Bastão 1 (Azul)
    const paddle1 = createPaddle(0.10, 0.05, 0.03, 0.1, 24, [0.1, 0.3, 0.9], [0.3, 0.3, 0.3]);
    const paddle1Matrix = new Matrix4();
    paddle1Matrix.setIdentity();
    paddle1Matrix.translate(paddlePositions.paddle1.x, 0.1, paddlePositions.paddle1.z);
    paddle1Matrix.scale(1.5, 1.5, 1.5);
    drawCylindricObject(paddle1, paddle1Matrix, gl, program);

    // Bastão 2 (Vermelho)
    const paddle2 = createPaddle(0.10, 0.05, 0.03, 0.1, 24, [0.9, 0.1, 0.1], [0.3, 0.3, 0.3]);
    const paddle2Matrix = new Matrix4();
    paddle2Matrix.setIdentity();
    paddle2Matrix.translate(paddlePositions.paddle2.x, 0.1, paddlePositions.paddle2.z);
    paddle2Matrix.scale(1.5, 1.5, 1.5);
    drawCylindricObject(paddle2, paddle2Matrix, gl, program);
}

// Função Genérica de Desenho (Usada pelo Disco também)
export function drawCylindricObject(cylindricObject, matrix, gl, program) {
    // Posição
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cylindricObject.vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(program.a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.a_Position);

    // Cor
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cylindricObject.colors, gl.STATIC_DRAW);
    gl.vertexAttribPointer(program.a_Color, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.a_Color);

    // Normais (Correção da Luz)
    if (cylindricObject.normals && program.a_Normal !== -1) {
        const normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, cylindricObject.normals, gl.STATIC_DRAW);
        gl.vertexAttribPointer(program.a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(program.a_Normal);
    }

    gl.uniformMatrix4fv(program.u_ModelMatrix, false, matrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, cylindricObject.vertices.length / 3);
}