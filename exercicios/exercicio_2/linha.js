function bresenham(x0, y0, x1, y1) {
    let points = [];

    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);

    let sx = (x0 < x1) ? 1 : -1;  // direção em x
    let sy = (y0 < y1) ? 1 : -1;  // direção em y

    let err = dx - dy;

    while (true) {
        points.push([x0, y0]); // salva o ponto atual

        // se chegamos ao destino, sai do loop
        if (x0 === x1 && y0 === y1) break;

        let e2 = 2 * err;

        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y0 += sy;
        }
    }

    return points;
}




const vert1 = [1, 2];
const vert2 = [1, 3];

const linha = bresenham(vert1[0], vert1[1], vert2[0], vert2[1]);
console.log(linha);
