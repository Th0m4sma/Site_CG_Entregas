// ========== MÓDULO DA MESA DE AIR HOCKEY ==========

// Função para criar um cilindro (para círculo central e pernas da mesa)
function createCylinder(r, g, b, segments = 16) {
    const vertices = [];
    const colors = [];

    // Tampa superior
    for (let i = 0; i < segments; i++) {
        const angle1 = (i / segments) * Math.PI * 2;
        const angle2 = ((i + 1) / segments) * Math.PI * 2;
        
        vertices.push(0, 0.5, 0);
        vertices.push(Math.cos(angle1) * 0.5, 0.5, Math.sin(angle1) * 0.5);
        vertices.push(Math.cos(angle2) * 0.5, 0.5, Math.sin(angle2) * 0.5);
    }

    // Tampa inferior
    for (let i = 0; i < segments; i++) {
        const angle1 = (i / segments) * Math.PI * 2;
        const angle2 = ((i + 1) / segments) * Math.PI * 2;
        
        vertices.push(0, -0.5, 0);
        vertices.push(Math.cos(angle2) * 0.5, -0.5, Math.sin(angle2) * 0.5);
        vertices.push(Math.cos(angle1) * 0.5, -0.5, Math.sin(angle1) * 0.5);
    }

    // Lados
    for (let i = 0; i < segments; i++) {
        const angle1 = (i / segments) * Math.PI * 2;
        const angle2 = ((i + 1) / segments) * Math.PI * 2;
        
        const x1 = Math.cos(angle1) * 0.5;
        const z1 = Math.sin(angle1) * 0.5;
        const x2 = Math.cos(angle2) * 0.5;
        const z2 = Math.sin(angle2) * 0.5;

        vertices.push(x1, 0.5, z1);
        vertices.push(x1, -0.5, z1);
        vertices.push(x2, -0.5, z2);

        vertices.push(x1, 0.5, z1);
        vertices.push(x2, -0.5, z2);
        vertices.push(x2, 0.5, z2);
    }

    // Adicionar cores
    const totalVertices = vertices.length / 3;
    for (let i = 0; i < totalVertices; i++) {
        colors.push(r, g, b);
    }

    return {
        vertices: new Float32Array(vertices),
        colors: new Float32Array(colors),
        count: totalVertices
    };
}

// Função para desenhar um cilindro
function drawCylinder(cylinder, matrix, gl, program) {
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cylinder.vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(program.a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.a_Position);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cylinder.colors, gl.STATIC_DRAW);
    gl.vertexAttribPointer(program.a_Color, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.a_Color);

    gl.uniformMatrix4fv(program.u_ModelMatrix, false, matrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, cylinder.count);
}

// Desenhar a mesa de air hockey
export function drawAirHockeyTable(Matrix4, createCube, drawCube, gl, program) {
    const tempMatrix = new Matrix4();
    tempMatrix.setIdentity();

    // Superfície da mesa (azul claro com bordas)
    const tableTopMatrix = new Matrix4();
    tableTopMatrix.set(tempMatrix);
    tableTopMatrix.translate(0, 0, 0);
    tableTopMatrix.scale(4, 0.1, 2.5);
    const tableTop = createCube(0.2, 0.4, 0.8);
    drawCube(tableTop, tableTopMatrix);

    // Área de jogo (azul escuro - superfície interna)
    const playAreaMatrix = new Matrix4();
    playAreaMatrix.set(tempMatrix);
    playAreaMatrix.translate(0, 0.06, 0);
    playAreaMatrix.scale(3.6, 0.02, 2.2);
    const playArea = createCube(0.1, 0.2, 0.5);
    drawCube(playArea, playAreaMatrix);

    // Linha central (branca)
    const centerLineMatrix = new Matrix4();
    centerLineMatrix.set(tempMatrix);
    centerLineMatrix.translate(0, 0.08, 0);
    centerLineMatrix.scale(0.05, 0.01, 2.2);
    const centerLine = createCube(1.0, 1.0, 1.0);
    drawCube(centerLine, centerLineMatrix);

    // Círculo central (branco)
    const centerCircleMatrix = new Matrix4();
    centerCircleMatrix.set(tempMatrix);
    centerCircleMatrix.translate(0, 0.08, 0);
    centerCircleMatrix.scale(0.4, 0.01, 0.4);
    const centerCircle = createCylinder(1.0, 1.0, 1.0, 32);
    drawCylinder(centerCircle, centerCircleMatrix, gl, program);

    // Gol esquerdo (vermelho)
    const leftGoalBackMatrix = new Matrix4();
    leftGoalBackMatrix.set(tempMatrix);
    leftGoalBackMatrix.translate(-1.95, 0.1, 0);
    leftGoalBackMatrix.scale(0.1, 0.20, 0.6);
    const leftGoalBack = createCube(0.8, 0.1, 0.1);
    drawCube(leftGoalBack, leftGoalBackMatrix);

    const leftGoalTopMatrix = new Matrix4();
    leftGoalTopMatrix.set(tempMatrix);
    leftGoalTopMatrix.translate(-1.90, 0.20, 0);
    leftGoalTopMatrix.scale(0.2, 0.05, 0.6);
    const leftGoalTop = createCube(0.8, 0.1, 0.1);
    drawCube(leftGoalTop, leftGoalTopMatrix);

    // Gol direito (vermelho)
    const rightGoalBackMatrix = new Matrix4();
    rightGoalBackMatrix.set(tempMatrix);
    rightGoalBackMatrix.translate(1.95, 0.1, 0);
    rightGoalBackMatrix.scale(0.1, 0.20, 0.6);
    const rightGoalBack = createCube(0.8, 0.1, 0.1);
    drawCube(rightGoalBack, rightGoalBackMatrix);

    const rightGoalTopMatrix = new Matrix4();
    rightGoalTopMatrix.set(tempMatrix);
    rightGoalTopMatrix.translate(1.90, 0.20, 0);
    rightGoalTopMatrix.scale(0.2, 0.05, 0.6);
    const rightGoalTop = createCube(0.8, 0.1, 0.1);
    drawCube(rightGoalTop, rightGoalTopMatrix);

    // Bordas laterais (brancas)
    const topBorderMatrix = new Matrix4();
    topBorderMatrix.set(tempMatrix);
    topBorderMatrix.translate(0, 0.1, 1.15);
    topBorderMatrix.scale(3.9, 0.15, 0.1);
    const topBorder = createCube(0.9, 0.9, 0.9);
    drawCube(topBorder, topBorderMatrix);

    const bottomBorderMatrix = new Matrix4();
    bottomBorderMatrix.set(tempMatrix);
    bottomBorderMatrix.translate(0, 0.1, -1.15);
    bottomBorderMatrix.scale(3.9, 0.15, 0.1);
    const bottomBorder = createCube(0.9, 0.9, 0.9);
    drawCube(bottomBorder, bottomBorderMatrix);

    // Bordas dos lados (brancas)
    const leftBorderTop = new Matrix4();
    leftBorderTop.set(tempMatrix);
    leftBorderTop.translate(-1.9, 0.1, 0.70);
    leftBorderTop.scale(0.1, 0.15, 0.8);
    const leftBorderTopCube = createCube(0.9, 0.9, 0.9);
    drawCube(leftBorderTopCube, leftBorderTop);

    const leftBorderBottom = new Matrix4();
    leftBorderBottom.set(tempMatrix);
    leftBorderBottom.translate(-1.9, 0.1, -0.70);
    leftBorderBottom.scale(0.1, 0.15, 0.8);
    const leftBorderBottomCube = createCube(0.9, 0.9, 0.9);
    drawCube(leftBorderBottomCube, leftBorderBottom);

    const rightBorderTop = new Matrix4();
    rightBorderTop.set(tempMatrix);
    rightBorderTop.translate(1.9, 0.1, 0.70);
    rightBorderTop.scale(0.1, 0.15, 0.8);
    const rightBorderTopCube = createCube(0.9, 0.9, 0.9);
    drawCube(rightBorderTopCube, rightBorderTop);

    const rightBorderBottom = new Matrix4();
    rightBorderBottom.set(tempMatrix);
    rightBorderBottom.translate(1.9, 0.1, -0.70);
    rightBorderBottom.scale(0.1, 0.15, 0.8);
    const rightBorderBottomCube = createCube(0.9, 0.9, 0.9);
    drawCube(rightBorderBottomCube, rightBorderBottom);

    // Pernas da mesa (4 cilindros marrons)
    const legPositions = [
        [-1.6, -0.45, 1.0],
        [1.6, -0.45, 1.0],
        [-1.6, -0.45, -1.0],
        [1.6, -0.45, -1.0]
    ];

    const leg = createCylinder(0.4, 0.3, 0.2, 16);
    
    for (let pos of legPositions) {
        const legMatrix = new Matrix4();
        legMatrix.set(tempMatrix);
        legMatrix.translate(pos[0], pos[1], pos[2]);
        legMatrix.scale(0.15, 0.8, 0.15);
        drawCylinder(leg, legMatrix, gl, program);
    }
}
