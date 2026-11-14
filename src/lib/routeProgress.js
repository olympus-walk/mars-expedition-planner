// Fracción de distancia recorrida en cada punto de la ruta (0 a 1).
// Las celdas de la malla son cuadradas en grados, así que coincide con la distancia que calcula astar.js.
export function routeFractions(latlngs) {
  const lengths = [0];
  for (let k = 1; k < latlngs.length; k++) {
    const [lat0, lon0] = latlngs[k - 1];
    const [lat1, lon1] = latlngs[k];
    lengths.push(lengths[k - 1] + Math.hypot(lat1 - lat0, lon1 - lon0));
  }
  const total = lengths[lengths.length - 1] || 1;
  return lengths.map(length => length / total);
}

export function indexAtFraction(fractions, fraction) {
  const index = fractions.findIndex(f => f >= fraction);
  return index === -1 ? fractions.length - 1 : index;
}
