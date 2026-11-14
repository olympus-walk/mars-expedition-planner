// Valida src/data/grid.json. Uso: node scripts/check_grid.mjs
import { readFileSync } from 'node:fs';
import { gridFromJson, latLonToCell, cellToLatLon, cellSizeKm } from '../src/lib/grid.js';
import { planRoute } from '../src/lib/astar.js';
import { AREA, BASE, WAYPOINTS, LIMITS } from '../src/data/mission.js';

const RADIUS = 3396190;
const Y0 = -244781.575189438;
const DEM_MIN = -4625.875;
const DEM_MAX = -322.5602722168;

const text = readFileSync(new URL('../src/data/grid.json', import.meta.url), 'utf8');
const data = JSON.parse(text);
const grid = gridFromJson(data);
const failures = [];

function check(ok, message) {
  console.log(ok ? 'ok   ' : 'FALLA', message);
  if (!ok) failures.push(message);
}

const total = grid.rows * grid.cols;
check(data.elev.length === total && data.slope.length === total && data.obstacle.length === total,
  `dimensiones ${grid.rows} x ${grid.cols} = ${total} celdas en elev, slope y obstacle`);

const [[south, west], [north, east]] = grid.bounds;
const [[areaSouth, areaWest], [areaNorth, areaEast]] = AREA.bounds;
check(south < north && west < east, 'bounds en formato [[sur, oeste], [norte, este]]');
check([south - areaSouth, west - areaWest, north - areaNorth, east - areaEast].every(d => Math.abs(d) < 0.001),
  `bounds a menos de 0.001° de AREA.bounds: ${JSON.stringify(grid.bounds)}`);

check(!/NaN|Infinity/.test(text), 'el JSON no contiene NaN ni Infinity');
const isNumberOrNull = (v) => v === null || (typeof v === 'number' && Number.isFinite(v));
check(data.elev.every(isNumberOrNull) && data.slope.every(isNumberOrNull), 'elev y slope solo tienen números finitos o null');
check(data.obstacle.every(v => v === 0 || v === 1), 'obstacle solo tiene 0 o 1');

const noDataMatches = data.elev.every((v, i) => (v === null) === (data.obstacle[i] === 1));
check(noDataMatches, `obstacle = 1 exactamente donde no hay elevación (${data.meta.noDataCells} celdas sin datos)`);
check(data.elev.every((v, i) => v !== null || data.slope[i] === null), 'sin elevación no hay pendiente');

const elevValues = data.elev.filter(v => v !== null);
const slopeValues = data.slope.filter(v => v !== null);
const range = (values) => values.reduce(([min, max], v) => [Math.min(min, v), Math.max(max, v)], [Infinity, -Infinity]);
const [elevMin, elevMax] = range(elevValues);
const [slopeMin, slopeMax] = range(slopeValues);
check(elevMin >= DEM_MIN && elevMax <= DEM_MAX, `elevación ${elevMin} a ${elevMax} m dentro del rango del DEM`);
check(slopeMin >= 0 && slopeMax < 90, `pendiente ${slopeMin} a ${slopeMax} grados`);
check(data.meta.unknownSlopeCells === data.elev.filter((v, i) => v !== null && data.slope[i] === null).length,
  `celdas con elevación pero sin pendiente: ${data.meta.unknownSlopeCells}`);

check(Math.abs(cellSizeKm(grid) * 1000 - data.meta.cellSizeNorthSouthM) < 0.1,
  `cellSizeKm de grid.js = ${(cellSizeKm(grid) * 1000).toFixed(2)} m`);

const firstCenterLat = ((Y0 - (data.meta.pixelWindow.firstRow + (data.meta.cellPixels - 1) / 2)) / RADIUS) * 180 / Math.PI;
check(Math.abs(cellToLatLon(grid, 0, 0)[0] - firstCenterLat) < 1e-6,
  'la fila 0 de la malla es la fila más al norte de la ventana del DEM');

let roundTripOk = true;
for (let r = 0; r < grid.rows; r++) {
  for (let c = 0; c < grid.cols; c++) {
    const [lat, lon] = cellToLatLon(grid, r, c);
    const [r2, c2] = latLonToCell(grid, lat, lon);
    if (r2 !== r || c2 !== c) roundTripOk = false;
  }
}
check(roundTripOk, 'cellToLatLon y latLonToCell son coherentes en todas las celdas');

for (const point of [BASE, ...WAYPOINTS]) {
  const inside = point.lat > south && point.lat < north && point.lon > west && point.lon < east;
  const [r, c] = latLonToCell(grid, point.lat, point.lon);
  const i = r * grid.cols + c;
  check(inside && !grid.obstacle[i], `${point.name}: celda (${r}, ${c}), elevación ${grid.elev[i].toFixed(1)} m, pendiente ${grid.slope[i].toFixed(1)}°`);
}

const hasStructure = ['elev', 'slope', 'obstacle'].every(key => grid[key].length === total);
check(hasStructure && grid.synthetic === false, 'estructura compatible con grid.js (elev, slope, obstacle, synthetic: false)');
check(grid.thermal === undefined, 'la malla real no trae datos térmicos');

for (const mode of ['walk', 'rover']) {
  const route = planRoute(grid, BASE, WAYPOINTS, mode, LIMITS);
  if (route.error) {
    check(false, `A* ${mode}: ${route.error}`);
    continue;
  }
  const numbers = [route.distKm, route.hours, route.dose, ...route.profile, ...route.legs.map(l => l.maxSlope), ...route.latlngs.flat()];
  const maxSlope = Math.max(...route.legs.map(l => l.maxSlope));
  check(numbers.every(Number.isFinite) && maxSlope <= LIMITS[mode].maxSlope,
    `A* ${mode}: ${route.distKm.toFixed(2)} km, ${route.hours.toFixed(1)} h, ${route.dose.toFixed(1)} µGy, ` +
    `pendiente máx ${maxSlope.toFixed(1)}° (límite ${LIMITS[mode].maxSlope}°), ` +
    `perfil ${Math.min(...route.profile).toFixed(1)} a ${Math.max(...route.profile).toFixed(1)} m`);
}

if (failures.length) {
  console.log(`\n${failures.length} comprobaciones fallaron`);
  process.exit(1);
}
console.log('\nTodas las comprobaciones pasaron');
