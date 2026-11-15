// ⚠️ Coordenadas APROXIMADAS de Gale / Monte Sharp. Persona 1 y 5 deben
// reemplazarlas con las reales tomadas de Mars Trek y del mapa de la ruta de Curiosity.
export const AREA = {
  name: 'Gale Crater · Mount Sharp (boxwork)',
  // Caja de trabajo (lat/lon planetocéntrico, lon Este)
  bounds: [[-4.80, 137.33], [-4.70, 137.43]],
  center: [-4.75, 137.38],
};

export const BASE = { id: 'base', name: 'Rover / Base', lat: -4.785, lon: 137.345, type: 'base', provenance: 'synthetic' };

export const WAYPOINTS = [
  { id: 'w1', name: 'Boxwork A', lat: -4.770, lon: 137.360, task: 'Sample calcium sulfate veins on the ridges', photo: '', provenance: 'synthetic' },
  { id: 'w2', name: 'Boxwork B', lat: -4.748, lon: 137.378, task: 'Context imaging and ridge height measurement', photo: '', provenance: 'synthetic' },
  { id: 'w3', name: 'Clay–sulfate contact', lat: -4.728, lon: 137.395, task: 'Sample the transition between units', photo: '', provenance: 'synthetic' },
  { id: 'w4', name: 'Viewpoint', lat: -4.715, lon: 137.412, task: 'Panorama and reconnaissance of the next outing', photo: '', provenance: 'synthetic' },
];
// photo: pegar URL de imagen cruda de Curiosity (mars.nasa.gov/msl/multimedia/raw-images/)

// Restricciones del traje / EVA
export const LIMITS = {
  walk:  { maxSlope: 15, speedKmh: 2.0, label: 'Walking' },
  rover: { maxSlope: 25, speedKmh: 8.0, label: 'Rover' },
  maxEvaHours: 6,
  // Dosis superficial de Curiosity RAD ~0.21 mGy/día (Hassler et al., 2014). Ajustar con datos reales.
  doseMicroGyPerHour: 210 / 24 * 1, // µGy/h ≈ 8.75
  maxEvaDoseMicroGy: 60,
};
