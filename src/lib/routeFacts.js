import { cellSizeKm } from './grid.js';

const round1 = (x) => Math.round(x * 10) / 10;
const round2 = (x) => Math.round(x * 100) / 100;

function lineCells(cols, from, to) {
  let row = (from / cols) | 0, col = from % cols;
  const endRow = (to / cols) | 0, endCol = to % cols;
  const rowStep = row < endRow ? 1 : -1, colStep = col < endCol ? 1 : -1;
  const rowDelta = Math.abs(endRow - row), colDelta = Math.abs(endCol - col);
  let error = colDelta - rowDelta;
  const cells = [];
  for (;;) {
    cells.push(row * cols + col);
    if (row === endRow && col === endCol) return cells;
    const doubled = 2 * error;
    if (doubled > -rowDelta) { error -= rowDelta; col += colStep; }
    if (doubled < colDelta) { error += colDelta; row += rowStep; }
  }
}

function checkStraightLine(g, leg, maxSlope) {
  const from = leg.cells[0], to = leg.cells[leg.cells.length - 1];
  let tooSteep = 0, noData = 0, maxSlopeOnLine = 0;
  for (const i of lineCells(g.cols, from, to)) {
    const slope = g.slope[i];
    if (g.obstacle[i] || !Number.isFinite(slope)) { noData++; continue; }
    if (slope > maxSlope) tooSteep++;
    maxSlopeOnLine = Math.max(maxSlopeOnLine, slope);
  }
  const rows = ((from / g.cols) | 0) - ((to / g.cols) | 0), cols = (from % g.cols) - (to % g.cols);
  return { km: Math.hypot(rows, cols) * cellSizeKm(g), tooSteep, noData, maxSlopeOnLine };
}

export function buildRouteFacts(g, route, mode, limits) {
  if (!route?.legs?.length) return null;
  const limit = limits[mode];
  const lines = route.legs.map(leg => checkStraightLine(g, leg, limit.maxSlope));
  const straightKm = lines.reduce((sum, line) => sum + line.km, 0);
  const steepestLeg = route.legs.reduce((a, b) => (b.maxSlope > a.maxSlope ? b : a));
  const movingHours = route.distKm / limit.speedKmh;

  return {
    mode: limit.label,
    terrain: g.synthetic ? 'example (synthetic) terrain' : 'USGS MSL Gale DEM',
    cellSizeM: Math.round(g.meta?.cellSizeNorthSouthM ?? cellSizeKm(g) * 1000),
    slopeLimitDeg: limit.maxSlope,
    speedKmh: limit.speedKmh,
    routeKm: round2(route.distKm),
    straightKm: round2(straightKm),
    extraPct: Math.round(Math.max(0, route.distKm / straightKm - 1) * 100),
    straightTooSteepCells: lines.reduce((sum, line) => sum + line.tooSteep, 0),
    straightNoDataCells: lines.reduce((sum, line) => sum + line.noData, 0),
    straightMaxSlopeDeg: round1(Math.max(...lines.map(line => line.maxSlopeOnLine))),
    routeMaxSlopeDeg: round1(steepestLeg.maxSlope),
    steepestLeg: `${steepestLeg.from} → ${steepestLeg.to}`,
    stops: route.legs.length - 1,
    elevationMinM: Number(Math.min(...route.profile).toFixed(0)),
    elevationMaxM: Number(Math.max(...route.profile).toFixed(0)),
    evaHours: round1(route.hours),
    movingHours: round1(movingHours),
    stopHours: round1(route.hours - movingHours),
    evaLimitHours: limits.maxEvaHours,
    overEvaLimit: route.hours > limits.maxEvaHours,
    doseMicroGy: round1(route.dose),
    doseRateMicroGyPerHour: limits.doseMicroGyPerHour,
    doseLimitMicroGy: limits.maxEvaDoseMicroGy,
    overDoseLimit: route.dose > limits.maxEvaDoseMicroGy,
    warnings: route.warnings,
  };
}
