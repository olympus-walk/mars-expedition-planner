// Builds the "fact sheet" of a calculated route.
// The assistant (Gemini or templates) may ONLY use these numbers.
import { cellSizeKm } from './grid.js';

const r1 = (x) => Math.round(x * 10) / 10;
const r2 = (x) => Math.round(x * 100) / 100;

// Cells crossed by the straight line between two cells (Bresenham)
function lineCells(W, a, b) {
  let r0 = (a / W) | 0, c0 = a % W;
  const r1_ = (b / W) | 0, c1 = b % W;
  const dr = Math.abs(r1_ - r0), dc = Math.abs(c1 - c0);
  const sr = r0 < r1_ ? 1 : -1, sc = c0 < c1 ? 1 : -1;
  let err = dc - dr;
  const out = [];
  for (;;) {
    out.push(r0 * W + c0);
    if (r0 === r1_ && c0 === c1) break;
    const e2 = 2 * err;
    if (e2 > -dr) { err -= dr; c0 += sc; }
    if (e2 < dc) { err += dc; r0 += sr; }
  }
  return out;
}

// Analyzes the direct (straight) line of one leg
function analyzeStraight(g, leg, maxSlope) {
  const W = g.cols, km = cellSizeKm(g);
  const a = leg.cells[0], b = leg.cells[leg.cells.length - 1];
  const cells = lineCells(W, a, b);
  let steep = 0, obstacle = 0, noData = 0, maxS = 0;
  for (const i of cells) {
    const s = g.slope[i];
    if (g.obstacle && g.obstacle[i]) obstacle++;
    if (!Number.isFinite(s)) { noData++; continue; }
    if (s > maxSlope) steep++;
    if (s > maxS) maxS = s;
  }
  const straightKm = Math.hypot(((a / W) | 0) - ((b / W) | 0), (a % W) - (b % W)) * km;
  return { straightKm, steep, obstacle, noData, maxS };
}

export function buildRouteFacts(g, route, mode, limits) {
  if (!route?.legs?.length) return null;
  const lim = limits[mode];

  let straightKm = 0, steep = 0, obstacle = 0, noData = 0, straightMax = 0, rerouted = 0;
  let hardest = route.legs[0];
  for (const leg of route.legs) {
    const s = analyzeStraight(g, leg, lim.maxSlope);
    straightKm += s.straightKm;
    steep += s.steep; obstacle += s.obstacle; noData += s.noData;
    straightMax = Math.max(straightMax, s.maxS);
    if (s.steep + s.obstacle + s.noData > 0) rerouted++;
    if (leg.maxSlope > hardest.maxSlope) hardest = leg;
  }

  const routeMax = Math.max(...route.legs.map(l => l.maxSlope));
  const detour = straightKm > 0 ? Math.max(0, (route.distKm - straightKm) / straightKm * 100) : 0;

  const f = {
    mode: lim.label,
    slope_limit_deg: lim.maxSlope,
    speed_kmh: lim.speedKmh,
    route_km: r2(route.distKm),
    straight_km: r2(straightKm),
    detour_pct: Math.round(detour),
    route_max_slope_deg: r1(routeMax),
    straight_max_slope_deg: r1(straightMax),
    straight_blocked_cells: { too_steep: steep, obstacle, no_data: noData },
    legs_total: route.legs.length,
    legs_rerouted: rerouted,
    hardest_leg: `${hardest.from} → ${hardest.to}`,
    hardest_leg_max_slope_deg: r1(hardest.maxSlope),
    science_stops: route.legs.length - 1,
    eva_hours: r1(route.hours),
    eva_limit_hours: limits.maxEvaHours,
    eva_margin_hours: r1(limits.maxEvaHours - route.hours),
    dose_uGy: r1(route.dose),
    dose_limit_uGy: limits.maxEvaDoseMicroGy,
    dose_margin_uGy: r1(limits.maxEvaDoseMicroGy - route.dose),
    cell_size_m: Math.round(g.meta?.cellSizeNorthSouthM ?? cellSizeKm(g) * 1000),
    synthetic_terrain: !!g.synthetic,
    warnings: route.warnings || [],
  };

  // Reasons: the "why", computed by code (the AI only rephrases them)
  const reasons = [];
  if (steep) reasons.push(`The direct line crosses ${steep} cells steeper than the ${f.slope_limit_deg}° limit (up to ${f.straight_max_slope_deg}°)`);
  if (obstacle) reasons.push(`The direct line crosses ${obstacle} obstacle cells`);
  if (noData) reasons.push(`The direct line crosses ${noData} cells without elevation data`);
  if (steep || obstacle || noData) {
    reasons.push(`So the route detours ${f.detour_pct}% and is ${f.route_km} km instead of ${f.straight_km} km`);
  } else {
    reasons.push(`The direct line has no blocked cells; the route is only ${f.detour_pct}% longer, favoring gentler slopes (max ${f.route_max_slope_deg}°)`);
  }
  reasons.push(f.eva_margin_hours >= 0
    ? `It fits the assumed ${f.eva_limit_hours} h EVA limit with ${f.eva_margin_hours} h to spare`
    : `It exceeds the assumed ${f.eva_limit_hours} h EVA limit by ${r1(-f.eva_margin_hours)} h`);
  f.reasons = reasons;
  return f;
}