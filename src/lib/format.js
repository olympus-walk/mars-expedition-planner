export const formatNumber = (value, decimals = 0) => value.toFixed(decimals).replace('-', '−');

export function formatLatLon(lat, lon, decimals = 4) {
  const latText = `${Math.abs(lat).toFixed(decimals)}° ${lat < 0 ? 'S' : 'N'}`;
  const lonText = `${Math.abs(lon).toFixed(decimals)}° ${lon < 0 ? 'W' : 'E'}`;
  return `${latText}, ${lonText}`;
}
