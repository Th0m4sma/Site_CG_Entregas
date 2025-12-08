// ========== MÓDULO DO PERSONAGEM MINECRAFT ==========

// Exportar função para desenhar o personagem
export function drawMinecraftCharacter(Matrix4, createCube, drawCube) {
    const tempMatrix = new Matrix4();
    
    // Posicionar personagem no lado esquerdo da mesa, de frente para o lado direito
    tempMatrix.setIdentity();
    tempMatrix.translate(-2.5, 0, 0); // Move para a esquerda da mesa
    tempMatrix.rotate(90, 0, 1, 0); // Rotaciona 90 graus para ficar de frente para o outro lado
    
    // Cabeça (cubo maior, marrom - mesma cor dos braços)
    const headMatrix = new Matrix4();
    headMatrix.set(tempMatrix);
    headMatrix.translate(0, 1.25, 0);
    headMatrix.scale(0.8, 0.8, 0.8);
    const head = createCube(0.7, 0.5, 0.3);
    drawCube(head, headMatrix);

    // Olho esquerdo (preto)
    const leftEyeMatrix = new Matrix4();
    leftEyeMatrix.set(tempMatrix);
    leftEyeMatrix.translate(-0.15, 1.35, 0.41);
    leftEyeMatrix.scale(0.12, 0.12, 0.05);
    const leftEye = createCube(0.0, 0.0, 0.0);
    drawCube(leftEye, leftEyeMatrix);

    // Olho direito (preto)
    const rightEyeMatrix = new Matrix4();
    rightEyeMatrix.set(tempMatrix);
    rightEyeMatrix.translate(0.15, 1.35, 0.41);
    rightEyeMatrix.scale(0.12, 0.12, 0.05);
    const rightEye = createCube(0.0, 0.0, 0.0);
    drawCube(rightEye, rightEyeMatrix);

    // Boca (linha horizontal preta)
    const mouthMatrix = new Matrix4();
    mouthMatrix.set(tempMatrix);
    mouthMatrix.translate(0, 1.10, 0.41);
    mouthMatrix.scale(0.3, 0.06, 0.05);
    const mouth = createCube(0.0, 0.0, 0.0);
    drawCube(mouth, mouthMatrix);

    // Corpo (retângulo vertical, verde)
    const bodyMatrix = new Matrix4();
    bodyMatrix.set(tempMatrix);
    bodyMatrix.translate(0, 0.25, 0);
    bodyMatrix.scale(0.8, 1.2, 0.4);
    const body = createCube(0.2, 0.8, 0.3);
    drawCube(body, bodyMatrix);

    // Braço direito (marrom)
    const rightArmMatrix = new Matrix4();
    rightArmMatrix.set(tempMatrix);
    rightArmMatrix.translate(0.55, 0.6, 0);
    rightArmMatrix.translate(0, -0.4, 0);
    rightArmMatrix.scale(0.3, 0.9, 0.3);
    const rightArm = createCube(0.7, 0.5, 0.3);
    drawCube(rightArm, rightArmMatrix);

    // Braço esquerdo (marrom)
    const leftArmMatrix = new Matrix4();
    leftArmMatrix.set(tempMatrix);
    leftArmMatrix.translate(-0.55, 0.6, 0);
    leftArmMatrix.translate(0, -0.4, 0);
    leftArmMatrix.scale(0.3, 0.9, 0.3);
    const leftArm = createCube(0.7, 0.5, 0.3);
    drawCube(leftArm, leftArmMatrix);

    // Perna direita (azul escuro)
    const rightLegMatrix = new Matrix4();
    rightLegMatrix.set(tempMatrix);
    rightLegMatrix.translate(0.25, -0.3, 0);
    rightLegMatrix.translate(0, -0.5, 0);
    rightLegMatrix.scale(0.3, 0.9, 0.3);
    const rightLeg = createCube(0.2, 0.3, 0.7);
    drawCube(rightLeg, rightLegMatrix);

    // Perna esquerda (azul escuro)
    const leftLegMatrix = new Matrix4();
    leftLegMatrix.set(tempMatrix);
    leftLegMatrix.translate(-0.25, -0.3, 0);
    leftLegMatrix.translate(0, -0.5, 0);
    leftLegMatrix.scale(0.3, 0.9, 0.3);
    const leftLeg = createCube(0.2, 0.3, 0.7);
    drawCube(leftLeg, leftLegMatrix);
}
