// ========== MÓDULO DA MESA DE AIR HOCKEY ==========

function createCylinder(r, g, b, segments = 16) {
    const vertices = [];
    const colors = [];
    const normals = []; 

    for (let i = 0; i < segments; i++) {
        const angle1 = (i / segments) * Math.PI * 2;
        const angle2 = ((i + 1) / segments) * Math.PI * 2;
        vertices.push(0, 0.5, 0);
        vertices.push(Math.cos(angle1) * 0.5, 0.5, Math.sin(angle1) * 0.5);
        vertices.push(Math.cos(angle2) * 0.5, 0.5, Math.sin(angle2) * 0.5);
        normals.push(0, 1, 0,  0, 1, 0,  0, 1, 0);
    }
    for (let i = 0; i < segments; i++) {
        const angle1 = (i / segments) * Math.PI * 2;
        const angle2 = ((i + 1) / segments) * Math.PI * 2;
        vertices.push(0, -0.5, 0);
        vertices.push(Math.cos(angle2) * 0.5, -0.5, Math.sin(angle2) * 0.5);
        vertices.push(Math.cos(angle1) * 0.5, -0.5, Math.sin(angle1) * 0.5);
        normals.push(0, -1, 0,  0, -1, 0,  0, -1, 0);
    }
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
        normals.push(x1, 0, z1,  x1, 0, z1,  x2, 0, z2);
        normals.push(x1, 0, z1,  x2, 0, z2,  x2, 0, z2);
    }
    const totalVertices = vertices.length / 3;
    for (let i = 0; i < totalVertices; i++) {
        colors.push(r, g, b);
    }
    return {
        vertices: new Float32Array(vertices),
        colors: new Float32Array(colors),
        normals: new Float32Array(normals),
        count: totalVertices
    };
}

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

    if (cylinder.normals && program.a_Normal !== -1) {
        const normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, cylinder.normals, gl.STATIC_DRAW);
        gl.vertexAttribPointer(program.a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(program.a_Normal);
    }
    gl.uniformMatrix4fv(program.u_ModelMatrix, false, matrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, cylinder.count);
}

export function drawAirHockeyTable(Matrix4, createCube, drawCube, gl, program, currentCamera = 0) {
    const tempMatrix = new Matrix4();
    tempMatrix.setIdentity();

    // 1. O QUARTO
    const roomMatrix = new Matrix4();
    roomMatrix.setIdentity();
    roomMatrix.translate(0, 4.0, 0);
    roomMatrix.scale(40.0, 30.0, 40.0); 
    const roomCube = createCube(0.6, 0.6, 0.6); 
    if (roomCube.normals) {
        for(let i = 0; i < roomCube.normals.length; i++) roomCube.normals[i] = -roomCube.normals[i];
    }
    drawCube(roomCube, roomMatrix);

    // ===========================================
    // 2. ABAJURES DE CHÃO (PONTAS - EIXO X)
    // ===========================================
    
    if (currentCamera !== 3) { // Esconde na visão de cima (tecla 4)
        
        // --- LADO ESQUERDO (X Negativo) ---
        // Base
        const post1Matrix = new Matrix4();
        post1Matrix.setIdentity();
        post1Matrix.translate(0.0, 3.0, -3.0); 
        post1Matrix.scale(0.2, 2.0, 0.2);
        const post = createCube(0.2, 0.2, 0.2); 
        drawCube(post, post1Matrix);

        // Luz (Cabeça)
        const lamp1Matrix = new Matrix4();
        lamp1Matrix.setIdentity();
        lamp1Matrix.translate(0.0, 2.0, -3.0); 
        // Rotaciona no eixo Z para apontar para o centro
        lamp1Matrix.rotate(-45, 0, 0, 1); 
        lamp1Matrix.scale(0.4, 0.4, 0.4);
        const lamp1 = createCube(1.0, 1.0, 0.8); // Luz Quente
        drawCube(lamp1, lamp1Matrix);

        // --- LADO DIREITO (X Positivo) ---
        // Base
        const post2Matrix = new Matrix4();
        post2Matrix.setIdentity();
        post2Matrix.translate(0.0, 3.0, 3.0); 
        post2Matrix.scale(0.2, 2.0, 0.2);
        drawCube(post, post2Matrix);

        // Luz (Cabeça)
        const lamp2Matrix = new Matrix4();
        lamp2Matrix.setIdentity();
        lamp2Matrix.translate(0.0, 2.0, 3.0);
        // Rotaciona no eixo Z (sentido oposto)
        lamp2Matrix.rotate(45, 0, 0, 1); 
        lamp2Matrix.scale(0.4, 0.4, 0.4);
        const lamp2 = createCube(0.8, 0.9, 1.0); // Luz Fria
        drawCube(lamp2, lamp2Matrix);
    }

    // ===========================================
    // 3. A MESA
    // ===========================================
    const tableTopMatrix = new Matrix4();
    tableTopMatrix.set(tempMatrix);
    tableTopMatrix.translate(0, 0, 0);
    tableTopMatrix.scale(4, 0.1, 2.5);
    const tableTop = createCube(0.2, 0.4, 0.8);
    drawCube(tableTop, tableTopMatrix);

    const playAreaMatrix = new Matrix4();
    playAreaMatrix.set(tempMatrix);
    playAreaMatrix.translate(0, 0.06, 0);
    playAreaMatrix.scale(3.6, 0.02, 2.2);
    const playArea = createCube(0.1, 0.2, 0.5);
    drawCube(playArea, playAreaMatrix);

    const centerLineMatrix = new Matrix4();
    centerLineMatrix.set(tempMatrix);
    centerLineMatrix.translate(0, 0.08, 0);
    centerLineMatrix.scale(0.05, 0.01, 2.2);
    const centerLine = createCube(1.0, 1.0, 1.0);
    drawCube(centerLine, centerLineMatrix);

    const centerCircleMatrix = new Matrix4();
    centerCircleMatrix.set(tempMatrix);
    centerCircleMatrix.translate(0, 0.08, 0);
    centerCircleMatrix.scale(0.4, 0.01, 0.4);
    const centerCircle = createCylinder(1.0, 1.0, 1.0, 32);
    drawCylinder(centerCircle, centerCircleMatrix, gl, program);

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

    const legPositions = [
        [-1.6, -0.45, 1.0], [1.6, -0.45, 1.0],
        [-1.6, -0.45, -1.0], [1.6, -0.45, -1.0]
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