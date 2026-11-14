import React, { useEffect, useMemo, useRef, useState } from 'react';
import MarsMap from './components/MarsMap.jsx';
import RouteSummary from './components/RouteSummary.jsx';
import HUD from './components/HUD.jsx';
import Icon from './components/Icon.jsx';
import { gridFromJson, latLonToCell } from './lib/grid.js';
import { planRoute } from './lib/astar.js';
import { formatLatLon, formatNumber } from './lib/format.js';
import { AREA, BASE, WAYPOINTS, LIMITS } from './data/mission.js';
import { initialLayerState } from './data/layers.js';
import demData from './data/grid.json';
import LayerPanel from './components/LayerPanel.jsx';

const recommendedBaseId = 'ctxGale';
const modeIcons = { walk: 'walk', rover: 'rover' };

function elevationAt(grid, point) {
  const [row, col] = latLonToCell(grid, point.lat, point.lon);
  return grid.elev[row * grid.cols + col];
}

export default function App() {
  const grid = useMemo(() => gridFromJson(demData), []);
  const [mode, setMode] = useState('walk');
  const [baseId, setBaseId] = useState(recommendedBaseId);
  const [layerState, setLayerState] = useState(initialLayerState);
  const [active, setActive] = useState(WAYPOINTS.map(w => w.id));
  const [selected, setSelected] = useState(null);
  const [route, setRoute] = useState(null);
  const [hud, setHud] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const menuButton = useRef(null);
  const closeButton = useRef(null);

  const closePanel = () => {
    if (panelOpen) menuButton.current?.focus();
    setPanelOpen(false);
  };

  useEffect(() => {
    if (!panelOpen) return undefined;
    closeButton.current?.focus();
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return;
      menuButton.current?.focus();
      setPanelOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [panelOpen]);

  const stops = WAYPOINTS.map((w, i) => ({ ...w, number: i + 1 }));
  const wps = stops.filter(w => active.includes(w.id));
  const stopNumbers = wps.map(w => w.number);

  const calc = () => {
    setRoute(planRoute(grid, BASE, wps, mode, LIMITS));
    closePanel();
  };
  const toggle = (id) => { setActive(a => a.includes(id) ? a.filter(x => x !== id) : [...a, id]); setRoute(null); };
  const changeMode = (key) => { setMode(key); setRoute(null); };

  if (hud) return <HUD route={route} stops={stopNumbers} limits={LIMITS} onExit={() => setHud(false)} />;

  return (
    <div className={`app${panelOpen ? ' panel-open' : ''}`}>
      <header className="topbar">
        <button ref={menuButton} className="button button-icon" onClick={() => setPanelOpen(true)}
          aria-label="Abrir panel de planificación" aria-expanded={panelOpen}>
          <Icon name="menu" />
        </button>
        <strong>Olympus Walk</strong>
        <span>{AREA.name}</span>
      </header>
      <div className="backdrop" onClick={closePanel} />

      <aside className="panel" aria-label="Planificación de la expedición">
        <header className="brand">
          <div>
            <h1>Olympus Walk</h1>
            <p>AREO-WALK, planificador de expediciones en Marte</p>
          </div>
          <button ref={closeButton} className="button button-icon panel-close" onClick={closePanel} aria-label="Cerrar panel">
            <Icon name="close" />
          </button>
        </header>

        <div className="site">
          <p className="site-name">{AREA.name}</p>
          {grid.synthetic
            ? <p className="status status-warn"><Icon name="alert" size={16} />Terreno de ejemplo (sintético)</p>
            : <p>Terreno: {grid.meta.product}, malla de {grid.meta.cellSizeNorthSouthM} m</p>}
        </div>

        <section>
          <h2>Modo de desplazamiento</h2>
          <div className="segmented">
            {['walk', 'rover'].map(key => (
              <button key={key} aria-pressed={mode === key} onClick={() => changeMode(key)}>
                <Icon name={modeIcons[key]} />{LIMITS[key].label}
              </button>
            ))}
          </div>
          <p className="note">
            Pendiente máxima {LIMITS[mode].maxSlope}° y {LIMITS[mode].speedKmh} km/h. Son supuestos de diseño, no valores validados.
          </p>
        </section>

        <section>
          <h2>Paradas científicas</h2>
          <ul className="stops">
            {stops.map(w => {
              const isSelected = selected === w.id;
              return (
                <li key={w.id} className={`stop${isSelected ? ' is-selected' : ''}`}>
                  <input type="checkbox" checked={active.includes(w.id)} onChange={() => toggle(w.id)}
                    aria-label={`Incluir ${w.name} en la ruta`} />
                  <button className="stop-name" aria-expanded={isSelected} onClick={() => setSelected(isSelected ? null : w.id)}>
                    <span className="stop-number">{w.number}</span>{w.name}<Icon name="chevron" size={16} />
                  </button>
                  {isSelected && (
                    <div className="stop-detail">
                      <p>{w.task}</p>
                      <p className="stop-data">{formatLatLon(w.lat, w.lon, 3)}, {formatNumber(elevationAt(grid, w))} m (DEM)</p>
                      {w.photo && <img src={w.photo} alt={w.name} />}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="status status-warn">
            <Icon name="alert" size={16} />
            <span>Puntos y base aproximados, sin validar. La ruta solo respeta la pendiente máxima a 25 m: no garantiza que el terreno sea seguro.</span>
          </p>
          <button className="button button-primary" onClick={calc} disabled={!wps.length}>Calcular ruta</button>
        </section>

        <section>
          <h2>Capas</h2>
          <LayerPanel baseId={baseId} setBaseId={setBaseId} state={layerState} setState={setLayerState}
            recommendedId={recommendedBaseId} />
        </section>

        <footer className="credits">
          Imágenes: NASA/JPL Mars Trek (CTX, THEMIS, MOLA, Viking). Elevación: USGS Astrogeology.
        </footer>
      </aside>

      <main>
        <MarsMap grid={grid} layerState={layerState} baseId={baseId} waypoints={wps}
          route={route?.legs ? route : null} selected={selected} onSelect={setSelected} />
        {route?.error && (
          <p className="dock status status-warn" role="alert"><Icon name="alert" size={16} />{route.error}. Prueba otro modo o quita una parada.</p>
        )}
        {route?.legs && (
          <RouteSummary route={route} mode={mode} limits={LIMITS} stops={stopNumbers} onOpenHud={() => setHud(true)} />
        )}
      </main>
    </div>
  );
}
