// ═══════════════════════════════════════════════════════════
// REGISTRO DE CAPAS DE AREO-WALK
// Para agregar una capa: copia un objeto, cambia los datos y listo.
//
// Tipos disponibles:
//   tile  → mapa base en tiles (Mars Trek). Solo una activa a la vez.
//   grid  → capa calculada desde grid.js (pendiente, térmica...)
//   image → imagen PNG/JPG georreferenciada (geología, minerales...)
//   line  → línea de coordenadas (ruta de Curiosity...)
//
// Grupos: base, terreno, geologia, seguridad, mision
// El orden de la lista = orden de dibujo (la última queda encima)
//
// provenance indica el origen de los datos:
//   real      → producto científico publicado (ver docs/data-sources.md)
//   derived   → calculado a partir de datos reales
//   synthetic → generado para demostración, no es ciencia
// ═══════════════════════════════════════════════════════════

const T = 'https://trek.nasa.gov/tiles/Mars/EQ';

export const LAYERS = [
  // ───────── MAPAS BASE ─────────
  {
    id: 'ctxGale', group: 'base', type: 'tile',
    name: 'Gale CTX', detail: 'Optical image', resolution: '10 m/px',
    url: `${T}/Gale_CTX_BlockAdj_dd/1.0.0//default/default028mm/{z}/{y}/{x}.png`,
    maxNativeZoom: 12,
    bounds: [[-6.5732988, 135.1842593], [-2.8077809, 139.2413012]],
    provenance: 'real',
    source: 'NASA/JPL Mars Trek · MRO CTX',
  },
  {
    id: 'viking', group: 'base', type: 'tile',
    name: 'Viking color', detail: 'Optical image', resolution: '232 m/px',
    url: `${T}/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0//default/default028mm/{z}/{y}/{x}.jpg`,
    maxNativeZoom: 7,
    provenance: 'real',
    source: 'NASA/JPL Mars Trek',
  },
  {
    id: 'mola', group: 'base', type: 'tile',
    name: 'MOLA', detail: 'Colored relief', resolution: '463 m/px',
    url: `${T}/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0//default/default028mm/{z}/{y}/{x}.jpg`,
    maxNativeZoom: 6,
    provenance: 'real',
    source: 'NASA/JPL Mars Trek · MOLA colored relief',
  },
  {
    id: 'themisDay', group: 'base', type: 'tile',
    name: 'THEMIS daytime', detail: 'Infrared, not temperature', resolution: '100 m/px',
    url: `${T}/THEMIS_DayIR_ControlledMosaics_100m_v2_oct2018/1.0.0//default/default028mm/{z}/{y}/{x}.png`,
    maxNativeZoom: 9,
    bounds: [[-65.0006576, -179.9999997], [65.0007535, 179.9998849]],
    provenance: 'real',
    source: 'NASA/JPL Mars Trek · Mars Odyssey THEMIS IR daytime (image, not temperature)',
  },
  {
    id: 'themisNight', group: 'base', type: 'tile',
    name: 'THEMIS nighttime', detail: 'Infrared, not temperature', resolution: '100 m/px',
    url: `${T}/THEMIS_NightIR_ControlledMosaics_100m_v2_oct2018/1.0.0//default/default028mm/{z}/{y}/{x}.png`,
    maxNativeZoom: 9,
    bounds: [[-65.0006576, -179.9999997], [65.0007535, 179.9998849]],
    provenance: 'real',
    source: 'NASA/JPL Mars Trek · Mars Odyssey THEMIS IR nighttime (image, not temperature)',
  },

  // ───────── TERRENO (calculadas en grid.js) ─────────
  {
    id: 'slope', group: 'terreno', type: 'grid', key: 'slope',
    name: 'Slope (USGS DEM, 25 m)', visible: true, opacity: 0.6,
    color: (s) => s > 25 ? [220, 30, 30, 200] : s > 15 ? [255, 140, 0, 170] : [0, 0, 0, 0],
    legend: [['transparent', '≤15°, no color'], ['#ff8c00', '15–25°'], ['#dc1e1e', '>25°']],
    provenance: 'derived',
    source: 'Derived from the USGS MSL Gale Merged DEM 1m, averaged over 25 m cells',
  },

  // ───────── SEGURIDAD ─────────
  {
    id: 'obstacle', group: 'seguridad', type: 'grid', key: 'obstacle',
    name: 'No DEM data', visible: true, opacity: 1,
    color: (o) => o ? [0, 0, 0, 220] : [0, 0, 0, 0],
    legend: [['#000', 'No elevation']],
    provenance: 'derived',
    source: 'Cells without valid elevation in the USGS DEM. Not a rock map',
  },

  // ───────── MISIÓN ─────────
  {
    id: 'curiosity', group: 'mision', type: 'line',
    name: 'Curiosity route (example)', visible: false, opacity: 1,
    color: '#ffffff', dash: '6 6',
    positions: [  // ⚠️ coordenadas de ejemplo: reemplazar por las reales
      [-4.795, 137.335], [-4.780, 137.350], [-4.765, 137.368], [-4.750, 137.385],
    ],
    provenance: 'synthetic',
    source: 'Illustrative example. Not the real Curiosity route',
  },
];

export const GROUPS = {
  base: 'Base map',
  terreno: 'Terrain',
  geologia: 'Geology',
  seguridad: 'Safety',
  mision: 'Mission',
};

// Estado inicial: { slope: {visible:true, opacity:0.6}, ... }
export const initialLayerState = () =>
  Object.fromEntries(
    LAYERS.filter(l => l.type !== 'tile')
      .map(l => [l.id, { visible: !!l.visible, opacity: l.opacity ?? 1 }])
  );