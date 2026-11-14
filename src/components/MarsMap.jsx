import React, { useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, ImageOverlay, Polyline, CircleMarker, Tooltip, Rectangle } from 'react-leaflet';
import { AREA, BASE } from '../data/mission.js';
import { LAYERS } from '../data/layers.js';
import { layerToImage } from '../lib/grid.js';

export default function MarsMap({ grid, baseId, layerState, waypoints, route, selected, onSelect }) {
  // Convierte las capas tipo "grid" en imágenes (solo una vez)
  const gridImgs = useMemo(() => Object.fromEntries(
    LAYERS.filter(l => l.type === 'grid' && grid[l.key]).map(l => [l.id, layerToImage(grid, l.key, l.color)])
  ), [grid]);

  const base = LAYERS.find(l => l.id === baseId);

  const renderLayer = (l) => {
    const st = layerState[l.id];
    if (!st?.visible) return null;
    switch (l.type) {
      case 'grid':
        if (!gridImgs[l.id]) return null;
        return <ImageOverlay key={l.id} url={gridImgs[l.id]} bounds={grid.bounds} opacity={st.opacity} className="pixel" />;
      case 'image':
        return <ImageOverlay key={l.id} url={l.url} bounds={l.bounds} opacity={st.opacity} />;
      case 'line':
        return <Polyline key={l.id} positions={l.positions}
          pathOptions={{ color: l.color, weight: 3, dashArray: l.dash }} />;
      default:
        return null;
    }
  };

  return (
    <MapContainer crs={L.CRS.EPSG4326} center={AREA.center} zoom={11} minZoom={2} maxZoom={14} className="map">
      <TileLayer key={base.id} url={base.url} maxNativeZoom={base.maxNativeZoom} bounds={base.bounds} noWrap attribution={base.source} />

      {LAYERS.filter(l => l.type !== 'tile').map(renderLayer)}

      <Rectangle bounds={grid.bounds} pathOptions={{ color: '#ff7a3d', weight: 1, fill: false, dashArray: '4' }} />
      {route?.latlngs && <Polyline positions={route.latlngs} pathOptions={{ color: '#00e5ff', weight: 4 }} />}

      <CircleMarker center={[BASE.lat, BASE.lon]} radius={9} pathOptions={{ color: '#fff', fillColor: '#ff7a3d', fillOpacity: 1 }}>
        <Tooltip permanent direction="top">Base</Tooltip>
      </CircleMarker>
      {waypoints.map((w, i) => (
        <CircleMarker key={w.id} center={[w.lat, w.lon]} radius={selected === w.id ? 10 : 7}
          eventHandlers={{ click: () => onSelect(w.id) }}
          pathOptions={{ color: '#fff', fillColor: '#ffd23d', fillOpacity: 1 }}>
          <Tooltip permanent direction="right">{i + 1}. {w.name}</Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}