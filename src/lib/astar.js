// A* sobre la cuadrícula. Costo = distancia × (1 + pendiente + terreno suelto)
import { latLonToCell, cellToLatLon, cellSizeKm } from './grid.js';

export function cellCost(g, i, maxSlope) {
  if (g.obstacle[i]) return Infinity;
  const s = g.slope[i];
  if (!Number.isFinite(s) || s > maxSlope) return Infinity;
  const looseSoil = g.thermal ? (1 - g.thermal[i]) * 1.5 : 0;
  return 1 + (s / maxSlope) * 2 + looseSoil;
}

export function astar(g, from, to, maxSlope) {
  const [sr, sc] = latLonToCell(g, from.lat, from.lon);
  const [tr, tc] = latLonToCell(g, to.lat, to.lon);
  const W = g.cols, N = g.rows * W, start = sr * W + sc, goal = tr * W + tc;
  const gS = new Float64Array(N).fill(Infinity), came = new Int32Array(N).fill(-1);
  const open = [[0, start]]; gS[start] = 0;
  const h = (i) => Math.hypot((i / W | 0) - tr, (i % W) - tc);
  const dirs = [[-1,0,1],[1,0,1],[0,-1,1],[0,1,1],[-1,-1,1.414],[-1,1,1.414],[1,-1,1.414],[1,1,1.414]];
  while (open.length) {
    let bi = 0; for (let k = 1; k < open.length; k++) if (open[k][0] < open[bi][0]) bi = k;
    const [, cur] = open.splice(bi, 1)[0];
    if (cur === goal) break;
    const r = cur / W | 0, c = cur % W;
    for (const [dr, dc, d] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= g.rows || nc >= W) continue;
      const ni = nr * W + nc, cost = cellCost(g, ni, maxSlope);
      if (!isFinite(cost)) continue;
      const t = gS[cur] + d * cost;
      if (t < gS[ni]) { gS[ni] = t; came[ni] = cur; open.push([t + h(ni), ni]); }
    }
  }
  if (!isFinite(gS[goal])) return null;
  const cells = []; for (let i = goal; i !== -1; i = came[i]) cells.push(i);
  cells.reverse();
  const km = cellSizeKm(g);
  let dist = 0;
  for (let k = 1; k < cells.length; k++) {
    const a = cells[k-1], b = cells[k];
    dist += Math.hypot((a / W | 0) - (b / W | 0), (a % W) - (b % W)) * km;
  }
  return {
    cells, distKm: dist,
    latlngs: cells.map(i => cellToLatLon(g, i / W | 0, i % W)),
    profile: cells.map(i => g.elev[i]),
    maxSlope: Math.max(...cells.map(i => g.slope[i])),
  };
}

// Ruta completa: base -> w1 -> ... -> wn -> base
export function planRoute(g, base, waypoints, mode, limits) {
  const stops = [base, ...waypoints, base], legs = [];
  for (let k = 0; k < stops.length - 1; k++) {
    const leg = astar(g, stops[k], stops[k+1], limits[mode].maxSlope);
    if (!leg) return { error: `No route found between ${stops[k].name} and ${stops[k+1].name} within the ${limits[mode].maxSlope}° slope limit on the 25 m grid` };
    legs.push({ ...leg, from: stops[k].name, to: stops[k+1].name });
  }
  const distKm = legs.reduce((a, l) => a + l.distKm, 0);
  const stopHours = waypoints.length * 0.5; // 30 min de ciencia por punto
  const hours = distKm / limits[mode].speedKmh + stopHours;
  const dose = hours * limits.doseMicroGyPerHour;
  return {
    legs, distKm, hours, dose,
    latlngs: legs.flatMap(l => l.latlngs),
    profile: legs.flatMap(l => l.profile),
    warnings: [
      hours > limits.maxEvaHours && `Exceeds assumed ${limits.maxEvaHours} h EVA limit`,
      dose > limits.maxEvaDoseMicroGy && `Above assumed ${limits.maxEvaDoseMicroGy} µGy dose limit`,
    ].filter(Boolean),
  };
}
