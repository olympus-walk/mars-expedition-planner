// Cuadrícula de terreno.
// generateGrid(): datos sintéticos para desarrollar.
// gridFromJson(): malla real de src/data/grid.json (ver scripts/extract_dem_grid.py y docs/data-sources.md).
import { AREA } from '../data/mission.js';

function noise(x, y, s) {
  return Math.sin(x * 0.31 + s) * Math.cos(y * 0.27 - s) +
         0.5 * Math.sin(x * 0.9 + y * 0.7 + s * 2) +
         0.25 * Math.cos(x * 1.7 - y * 1.3);
}

export function generateGrid(rows = 80, cols = 80) {
  const n = rows * cols;
  const slope = new Float32Array(n), thermal = new Float32Array(n),
        obstacle = new Uint8Array(n), elev = new Float32Array(n);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c;
    elev[i] = -4200 + r * 6 + noise(c, r, 1) * 40;           // sube hacia el sur (r crece hacia el sur)
    slope[i] = Math.max(0, 8 + noise(c, r, 3) * 9 + (Math.abs(noise(c * 2, r * 2, 5)) > 1.3 ? 12 : 0));
    thermal[i] = 0.5 + noise(c, r, 7) * 0.3;                  // 0 polvo suelto ... 1 roca firme
    obstacle[i] = Math.abs(noise(c * 1.5, r * 1.5, 9)) > 1.45 ? 1 : 0;
  }
  return { rows, cols, bounds: AREA.bounds, slope, thermal, obstacle, elev, synthetic: true };
}

export function gridFromJson(data) {
  const toNumbers = (values) => Float32Array.from(values, v => v ?? NaN);
  return {
    rows: data.rows,
    cols: data.cols,
    bounds: data.bounds,
    elev: toNumbers(data.elev),
    slope: toNumbers(data.slope),
    obstacle: Uint8Array.from(data.obstacle),
    synthetic: data.synthetic,
    meta: data.meta,
  };
}

export function latLonToCell(g, lat, lon) {
  const [[s, w], [n, e]] = g.bounds;
  const r = Math.floor((n - lat) / (n - s) * g.rows);
  const c = Math.floor((lon - w) / (e - w) * g.cols);
  return [Math.min(g.rows - 1, Math.max(0, r)), Math.min(g.cols - 1, Math.max(0, c))];
}

export function cellToLatLon(g, r, c) {
  const [[s, w], [n, e]] = g.bounds;
  return [n - (r + 0.5) / g.rows * (n - s), w + (c + 0.5) / g.cols * (e - w)];
}

export function cellSizeKm(g) {
  const [[s, w], [n, e]] = g.bounds;
  const kmPerDeg = 59.27; // Marte: 2π·3396/360 (radio ecuatorial ≈ 3396 km)
  return ((n - s) * kmPerDeg) / g.rows;
}

// Renderiza una capa como imagen (data URL) para L.imageOverlay
export function layerToImage(g, key, colorFn) {
  const cv = document.createElement('canvas');
  cv.width = g.cols; cv.height = g.rows;
  const ctx = cv.getContext('2d'), img = ctx.createImageData(g.cols, g.rows);
  for (let i = 0; i < g.rows * g.cols; i++) {
    const [R, G, B, A] = colorFn(g[key][i], i);
    img.data.set([R, G, B, A], i * 4);
  }
  ctx.putImageData(img, 0, 0);
  return cv.toDataURL();
}
