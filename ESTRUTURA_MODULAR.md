# Estrutura Modular do Projeto

## Arquivos Criados

O projeto foi refatorado para uma arquitetura modular com os seguintes arquivos:

### Arquivos Modulares (ES6 Modules)

1. **personagemModule.js** - Contém todas as funções relacionadas ao personagem Minecraft
   - `drawMinecraftCharacter()` - Desenha o personagem com todas as partes (cabeça, corpo, braços, pernas)

2. **bastao.js** - Contém todas as funções relacionadas aos bastões (paddles)
   - `drawPaddles()` - Desenha os dois bastões na cena
   - `drawCylindricObject()` - Função auxiliar para desenhar objetos cilíndricos

3. **disco.js** - Contém todas as funções relacionadas ao disco (puck)
   - `drawPuck()` - Desenha o disco
   - `updatePuckPhysics()` - Atualiza a física e colisões do disco
   - `puckState` - Estado exportado com posição e velocidade do disco

4. **mesaAirHockey.js** - Contém todas as funções relacionadas à mesa de air hockey
   - `drawAirHockeyTable()` - Desenha a mesa completa com superfície, bordas, gols e pernas

5. **objetos.js** - Arquivo principal que importa e coordena todos os módulos
   - Gerencia o WebGL, shaders, câmeras e loop de renderização
   - Importa e usa funções dos outros módulos
   - Contém a classe `Matrix4` e funções base como `createCube()` e `drawCube()`

### Arquivos de Backup

- **Personagem_backup.js** - Backup do arquivo original Personagem.js
- **objetos_old.js** - Backup do arquivo objetos.js original (não modular)

## Como Usar

### Para usar a versão modular:

Abra o arquivo `teste_modular.html` no navegador. Este arquivo carrega o `objetos.js` como um módulo ES6:

```html
<script type="module" src="func_js/objetos.js"></script>
```

### Para usar a versão antiga (não modular):

Os arquivos originais (Personagem.js) ainda funcionam normalmente e podem ser usados no `jogo.html`.

## Vantagens da Estrutura Modular

✅ **Organização** - Cada objeto tem seu próprio arquivo
✅ **Manutenibilidade** - Mais fácil encontrar e modificar código específico  
✅ **Reusabilidade** - Módulos podem ser importados em outros projetos
✅ **Clareza** - Separação clara de responsabilidades
✅ **Escalabilidade** - Fácil adicionar novos objetos sem alterar código existente

## Estrutura de Pastas

```
func_js/
├── objetos.js           # Arquivo principal (importa módulos)
├── personagemModule.js  # Módulo do personagem
├── bastao.js            # Módulo dos bastões
├── disco.js             # Módulo do disco
├── mesaAirHockey.js     # Módulo da mesa
├── Personagem.js        # Versão original (não modular)
├── Personagem_backup.js # Backup
└── objetos_old.js       # Backup do objetos.js antigo
```

## Notas Importantes

- A versão modular requer um servidor web para funcionar corretamente (devido às políticas CORS dos módulos ES6)
- Para testar localmente, use um servidor como Live Server do VS Code ou Python's SimpleHTTPServer
- Os módulos ES6 usam `export` e `import` para compartilhar funcionalidades
