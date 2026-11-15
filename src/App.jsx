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
import Assistant from './components/Assistant.jsx';

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

  return (
    <>
    <div className={`app${panelOpen ? ' panel-open' : ''}${hud ? ' is-covered' : ''}`}>
      <header className="topbar">
        <button ref={menuButton} className="button button-icon" onClick={() => setPanelOpen(true)}
          aria-label="Open planning panel" aria-expanded={panelOpen}>
          <Icon name="menu" />
        </button>
        <strong>Olympus Walk</strong>
        <span>{AREA.name}</span>
      </header>
      <div className="backdrop" onClick={closePanel} />

      <aside className="panel" aria-label="Expedition planning">
        <header className="brand">
          <div>
            <h1>Olympus Walk</h1>
            <p>Mars expedition planner</p>
          </div>
          <button ref={closeButton} className="button button-icon panel-close" onClick={closePanel} aria-label="Close panel">
            <Icon name="close" />
          </button>
        </header>

        <p className="site">{AREA.name}</p>

        <section>
          <h2>Exploration mode</h2>
          <div className="segmented">
            {['walk', 'rover'].map(key => (
              <button key={key} aria-pressed={mode === key} onClick={() => changeMode(key)}>
                <Icon name={modeIcons[key]} />{LIMITS[key].label}
              </button>
            ))}
          </div>
          <p className="note">
            Assumed limits: slopes up to {LIMITS[mode].maxSlope}° at {LIMITS[mode].speedKmh} km/h (illustrative, not validated).
          </p>
        </section>

        <section>
          <h2>Science stops</h2>
          <ul className="stops">
            {stops.map(w => {
              const isSelected = selected === w.id;
              return (
                <li key={w.id} className={`stop${isSelected ? ' is-selected' : ''}`}>
                  <input type="checkbox" checked={active.includes(w.id)} onChange={() => toggle(w.id)}
                    aria-label={`Include ${w.name} in the route`} />
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
          <p className="caution">
            <Icon name="alert" size={18} />
            <span>Base and stops are approximate and unvalidated. The route only respects the maximum slope on 25 m cells: it does not certify that the terrain is safe.</span>
          </p>
          <button className="button button-primary" onClick={calc} disabled={!wps.length}>Calculate route</button>
        </section>

        <section>
          <h2>Layers</h2>
          <LayerPanel baseId={baseId} setBaseId={setBaseId} state={layerState} setState={setLayerState}
            recommendedId={recommendedBaseId} />
        </section>

        <section>
          <h2>Mission data</h2>
          <dl className="facts">
            <div>
              <dt>Terrain</dt>
              <dd>{grid.synthetic ? 'Example (synthetic)' : `USGS MSL Gale DEM (1 m), ${grid.meta.cellSizeNorthSouthM} m grid`}</dd>
            </div>
            <div><dt>Imagery</dt><dd>NASA/JPL Mars Trek (CTX, THEMIS, MOLA, Viking)</dd></div>
            <div><dt>EVA limit (assumed)</dt><dd>{LIMITS.maxEvaHours} h</dd></div>
            <div><dt>Dose limit (assumed)</dt><dd>{LIMITS.maxEvaDoseMicroGy} µGy</dd></div>
          </dl>
          <p className="note">EVA and dose limits and speeds are illustrative assumptions, not validated operational limits.</p>
        </section>
      </aside>

      <main>
        <MarsMap grid={grid} layerState={layerState} baseId={baseId} waypoints={wps}
          route={route?.legs ? route : null} selected={selected} onSelect={setSelected} />
        {route?.error && (
          <p className="dock status status-warn" role="alert"><Icon name="alert" size={16} />{route.error}. Try another mode or remove a stop.</p>
        )}
        {route?.legs && (
          <RouteSummary route={route} mode={mode} limits={LIMITS} stops={stopNumbers} onOpenHud={() => setHud(true)} />
          
        )}
        {!hud && (
          <Assistant grid={grid} route={route?.legs ? route : null} mode={mode} limits={LIMITS} />
        )}
      </main>
    </div>
    {hud && <HUD route={route} stops={stopNumbers} limits={LIMITS} onExit={() => setHud(false)} />}
    </>
  );
}
