import React, { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, ImageOverlay, Polyline, Marker, Tooltip, Rectangle, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import { AREA, BASE } from '../data/mission.js';
import { LAYERS } from '../data/layers.js';
import { layerToImage, latLonToCell } from '../lib/grid.js';
import { formatLatLon, formatNumber } from '../lib/format.js';

const pinHtml = (symbol, label) => `<span aria-hidden="true">${symbol}</span><span class="sr-only">${label}</span>`;

const baseIcon = L.divIcon({ className: 'map-pin map-pin-base', html: pinHtml('B', 'Base'), iconSize: [28, 28] });

function stopIcon(waypoint, isSelected) {
  const className = `map-pin map-pin-stop${isSelected ? ' is-selected' : ''}`;
  const label = `Parada ${waypoint.number}: ${waypoint.name}`;
  return L.divIcon({ className, html: pinHtml(waypoint.number, label), iconSize: [28, 28] });
}

const isActivationKey = (event) => ['Enter', ' '].includes(event.originalEvent.key);

function ResizeWatcher() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

function RouteFocus({ route }) {
  const map = useMap();
  useEffect(() => {
    if (!route) return;
    map.invalidateSize();
    map.fitBounds(L.latLngBounds(route.latlngs), { padding: [24, 24], maxZoom: map.getZoom() });
  }, [map, route]);
  return null;
}

function ResolutionNote({ base }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  const enlargement = 2 ** Math.round(zoom - base.maxNativeZoom);
  if (enlargement < 4) return null;
  return (
    <p className="map-note">
      {base.name} tiene {base.resolution}: aquí se ve ampliada {enlargement} veces.
    </p>
  );
}

function CursorReadout({ grid }) {
  const [point, setPoint] = useState(null);
  useMapEvents({ mousemove: (event) => setPoint(event.latlng), mouseout: () => setPoint(null) });
  if (!point) return null;

  const [[south, west], [north, east]] = grid.bounds;
  const isInside = point.lat > south && point.lat < north && point.lng > west && point.lng < east;
  let elevation = NaN;
  if (isInside) {
    const [row, col] = latLonToCell(grid, point.lat, point.lng);
    elevation = grid.elev[row * grid.cols + col];
  }

  return (
    <div className="map-readout">
      <span>{formatLatLon(point.lat, point.lng)}</span>
      {Number.isFinite(elevation) && <span>{formatNumber(elevation)} m (DEM)</span>}
    </div>
  );
}

export default function MarsMap({ grid, baseId, layerState, waypoints, route, selected, onSelect }) {
  const [isLoading, setIsLoading] = useState(false);

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
    <MapContainer crs={L.CRS.EPSG4326} bounds={AREA.bounds} boundsOptions={{ padding: [24, 24] }}
      minZoom={2} maxZoom={14} zoomControl={false} className="map">
      <ZoomControl position="topright" zoomInTitle="Acercar" zoomOutTitle="Alejar" />
      <ResizeWatcher />
      <RouteFocus route={route} />
      <TileLayer key={base.id} url={base.url} maxNativeZoom={base.maxNativeZoom} bounds={base.bounds} noWrap
        attribution={base.source}
        eventHandlers={{ loading: () => setIsLoading(true), load: () => setIsLoading(false) }} />

      {LAYERS.filter(l => l.type !== 'tile').map(renderLayer)}

      <Rectangle bounds={grid.bounds} interactive={false}
        pathOptions={{ color: '#e8743b', weight: 1, fill: false, dashArray: '5 4' }} />
      {route?.latlngs && <>
        <Polyline positions={route.latlngs} interactive={false} pathOptions={{ color: '#0b1017', weight: 8, opacity: 0.8 }} />
        <Polyline positions={route.latlngs} interactive={false} pathOptions={{ color: '#6ccadb', weight: 4 }} />
      </>}

      <Marker position={[BASE.lat, BASE.lon]} icon={baseIcon} keyboard={false}>
        <Tooltip direction="top" offset={[0, -14]}>{BASE.name}</Tooltip>
      </Marker>
      {waypoints.map(w => (
        <Marker key={w.id} position={[w.lat, w.lon]} icon={stopIcon(w, selected === w.id)}
          eventHandlers={{
            click: () => onSelect(w.id),
            keypress: (event) => {
              if (!isActivationKey(event)) return;
              event.originalEvent.preventDefault();
              onSelect(w.id);
            },
          }}>
          <Tooltip direction="top" offset={[0, -14]}>{w.number}. {w.name}</Tooltip>
        </Marker>
      ))}

      <CursorReadout grid={grid} />
      <ResolutionNote base={base} />
      {isLoading && <div className="map-loading" role="status">Cargando imágenes…</div>}
    </MapContainer>
  );
}
