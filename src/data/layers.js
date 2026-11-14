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
    name: 'Óptica · CTX Gale (detalle)',
    url: `${T}/Gale_CTX_BlockAdj_dd/1.0.0//default/default028mm/{z}/{y}/{x}.png`,
    maxNativeZoom: 12,
    bounds: [[-6.5732988, 135.1842593], [-2.8077809, 139.2413012]],
    provenance: 'real',
    source: 'NASA/JPL Mars Trek · MRO CTX',
  },
  {
    id: 'viking', group: 'base', type: 'tile',
    name: 'Óptica · Viking color',
    url: `${T}/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0//default/default028mm/{z}/{y}/{x}.jpg`,
    maxNativeZoom: 7,
    provenance: 'real',
    source: 'NASA/JPL Mars Trek',
  },
  {
    id: 'mola', group: 'base', type: 'tile',
    name: 'Topografía · MOLA',
    url: `${T}/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0//default/default028mm/{z}/{y}/{x}.jpg`,
    maxNativeZoom: 6,
    provenance: 'real',
    source: 'NASA/JPL Mars Trek · MOLA relieve coloreado',
  },
  {
    id: 'themisDay', group: 'base', type: 'tile',
    name: 'Infrarrojo · THEMIS diurno (100 m)',
    url: `${T}/THEMIS_DayIR_ControlledMosaics_100m_v2_oct2018/1.0.0//default/default028mm/{z}/{y}/{x}.png`,
    maxNativeZoom: 9,
    bounds: [[-65.0006576, -179.9999997], [65.0007535, 179.9998849]],
    provenance: 'real',
    source: 'NASA/JPL Mars Trek · Mars Odyssey THEMIS IR diurno (imagen, no es temperatura)',
  },
  {
    id: 'themisNight', group: 'base', type: 'tile',
    name: 'Infrarrojo · THEMIS nocturno (100 m)',
    url: `${T}/THEMIS_NightIR_ControlledMosaics_100m_v2_oct2018/1.0.0//default/default028mm/{z}/{y}/{x}.png`,
    maxNativeZoom: 9,
    bounds: [[-65.0006576, -179.9999997], [65.0007535, 179.9998849]],
    provenance: 'real',
    source: 'NASA/JPL Mars Trek · Mars Odyssey THEMIS IR nocturno (imagen, no es temperatura)',
  },

  // ───────── TERRENO (calculadas en grid.js) ─────────
  {
    id: 'slope', group: 'terreno', type: 'grid', key: 'slope',
    name: 'Pendiente (DEM USGS, 25 m)', visible: true, opacity: 0.6,
    color: (s) => s > 25 ? [220, 30, 30, 200] : s > 15 ? [255, 140, 0, 170] : [40, 200, 120, 90],
    legend: [['#28c878', '≤15°'], ['#ff8c00', '15–25°'], ['#dc1e1e', '>25°']],
    provenance: 'derived',
    source: 'Derivada del MSL Gale Merged DEM 1m (USGS), media en celdas de 25 m',
  },

  // ───────── SEGURIDAD ─────────
  {
    id: 'obstacle', group: 'seguridad', type: 'grid', key: 'obstacle',
    name: 'Sin datos del DEM', visible: true, opacity: 1,
    color: (o) => o ? [0, 0, 0, 220] : [0, 0, 0, 0],
    legend: [['#000', 'Sin elevación']],
    provenance: 'derived',
    source: 'Celdas sin elevación válida en el DEM de USGS. No es un mapa de rocas',
  },

  // ───────── MISIÓN ─────────
  {
    id: 'curiosity', group: 'mision', type: 'line',
    name: 'Ruta de Curiosity (ejemplo)', visible: false, opacity: 1,
    color: '#ffffff', dash: '6 6',
    positions: [  // ⚠️ coordenadas de ejemplo: reemplazar por las reales
      [-4.795, 137.335], [-4.780, 137.350], [-4.765, 137.368], [-4.750, 137.385],
    ],
    provenance: 'synthetic',
    source: 'Ejemplo ilustrativo. No es la ruta real de Curiosity',
  },
];

export const GROUPS = {
  base: 'Mapa base',
  terreno: 'Terreno',
  geologia: 'Geología',
  seguridad: 'Seguridad',
  mision: 'Misión',
};

// Estado inicial: { slope: {visible:true, opacity:0.6}, ... }
export const initialLayerState = () =>
  Object.fromEntries(
    LAYERS.filter(l => l.type !== 'tile')
      .map(l => [l.id, { visible: !!l.visible, opacity: l.opacity ?? 1 }])
  );