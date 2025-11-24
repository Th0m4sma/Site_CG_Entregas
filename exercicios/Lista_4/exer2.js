// Função que faz a transformação de coordenadas do mundo para a viewport
function worldToViewport(x, y, xwmin, ywmin, xwmax, ywmax, xvmin, yvmin, xvmax, yvmax) {
  const xv = xvmin + (x - xwmin) * (xvmax - xvmin) / (xwmax - xwmin);
  const yv = yvmin + (y - ywmin) * (yvmax - yvmin) / (ywmax - ywmin);
  return { xv, yv };
}

// Triângulo nas coordenadas do mundo
const triangle = [
  { x: 10, y: 10 },
  { x: 20, y: 50 },
  { x: 30, y: 10 }
];

// Viewport fixa
const viewport = {
  xvmin: 0,
  yvmin: 0,
  xvmax: 5,
  yvmax: 10
};

// Lista de janelas de recorte (window)
const windows = [
  { xwmin: 0, ywmin: 0, xwmax: 100, ywmax: 200 },
  { xwmin: 0, ywmin: 0, xwmax: 200, ywmax: 100 },
  { xwmin: 0, ywmin: 0, xwmax: 1000, ywmax: 60 }
];

// Aplicar o mapeamento para cada janela
windows.forEach((win, i) => {
  console.log(`\n=== Janela (${i + 1}) ===`);
  console.log(`Window: (${win.xwmin}, ${win.ywmin}) a (${win.xwmax}, ${win.ywmax})`);

  triangle.forEach((p, idx) => {
    const { xv, yv } = worldToViewport(
      p.x, p.y,
      win.xwmin, win.ywmin, win.xwmax, win.ywmax,
      viewport.xvmin, viewport.yvmin, viewport.xvmax, viewport.yvmax
    );

    console.log(`P${idx + 1} -> (${xv.toFixed(3)}, ${yv.toFixed(3)})`);
  });
});
