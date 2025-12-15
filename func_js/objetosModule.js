// ========== personagemModule.js ==========

export function drawMinecraftCharacter(gl, program, Matrix4, createCube, drawCube, currentZ, isPlayer2 = false, currentCamera = 0) {
    const baseMatrix = new Matrix4();
    baseMatrix.setIdentity();

    // Ombro no centro
    const shoulderOffset = 0.55; 
    const shoulderHeight = 0.8;
    const posX = isPlayer2 ? 2.5 : -2.5;
    const rotationY = isPlayer2 ? -90 : 90;
    
    baseMatrix.translate(posX, 0, 0); 
    baseMatrix.rotate(rotationY, 0, 1, 0); 
    baseMatrix.translate(-shoulderOffset, 0, 0); 

    // CORES
    const skinColor = [0.7, 0.5, 0.3];
    // Jogador 1 Azul, Jogador 2 Vermelho
    const shirtColor = isPlayer2 ? [0.9, 0.1, 0.1] : [0.1, 0.3, 0.9];
    const pantsColor = isPlayer2 ? [0.4, 0.05, 0.05] : [0.05, 0.1, 0.4];
    const black = [0, 0, 0];

    // Cabeça (esconde na visão 5 se for jogador 1)
    const hideHead = (currentCamera === 4 && !isPlayer2); // camera 4 = tecla 5
    if (!hideHead) {
        drawCube(createCube(...skinColor), new Matrix4().set(baseMatrix).translate(0, 1.25, 0).scale(0.8, 0.8, 0.8), gl, program);
        drawCube(createCube(...black), new Matrix4().set(baseMatrix).translate(-0.15, 1.35, 0.41).scale(0.12, 0.12, 0.05), gl, program);
        drawCube(createCube(...black), new Matrix4().set(baseMatrix).translate(0.15, 1.35, 0.41).scale(0.12, 0.12, 0.05), gl, program);
        drawCube(createCube(...black), new Matrix4().set(baseMatrix).translate(0, 1.10, 0.41).scale(0.3, 0.06, 0.05), gl, program);
    }
    // Corpo
    drawCube(createCube(...shirtColor), new Matrix4().set(baseMatrix).translate(0, 0.25, 0).scale(0.8, 1.2, 0.4), gl, program);
    // Pernas
    drawCube(createCube(...pantsColor), new Matrix4().set(baseMatrix).translate(-0.25, -0.6, 0).scale(0.3, 0.9, 0.3), gl, program);
    drawCube(createCube(...pantsColor), new Matrix4().set(baseMatrix).translate(0.25, -0.6, 0).scale(0.3, 0.9, 0.3), gl, program);

    // Braço esquerdo
    const leftArmM = new Matrix4().set(baseMatrix);
    leftArmM.translate(-shoulderOffset, shoulderHeight, 0); 
    leftArmM.translate(0, -0.6, 0); 
    leftArmM.scale(0.3, 1.1, 0.3); 
    drawCube(createCube(...skinColor), leftArmM, gl, program);

    // Braço direito
    const angleMultiplier = isPlayer2 ? 1 : -1;
    const targetAngle = Math.atan2(currentZ * angleMultiplier, 1.0) * (180 / Math.PI);

    const rightArmM = new Matrix4();
    rightArmM.set(baseMatrix);
    
    rightArmM.translate(shoulderOffset, shoulderHeight, 0); 
    
    // Rotação lateral (segue o bastão)
    rightArmM.rotate(targetAngle, 0, 1, 0); 

    rightArmM.rotate(-60, 1, 0, 0); 
    
    // Pivô e Escala
    rightArmM.translate(0, -0.6, 0); 
    rightArmM.scale(0.3, 1.1, 0.3); 
    
    drawCube(createCube(...skinColor), rightArmM, gl, program);
}