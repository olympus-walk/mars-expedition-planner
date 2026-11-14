import React, { useMemo, useState } from 'react';
import MarsMap from './components/MarsMap.jsx';
import Profile from './components/Profile.jsx';
import HUD from './components/HUD.jsx';
import { gridFromJson } from './lib/grid.js';
import { planRoute } from './lib/astar.js';
import { AREA, BASE, WAYPOINTS, LIMITS } from './data/mission.js';
import { initialLayerState } from './data/layers.js';
import demData from './data/grid.json';
import LayerPanel from './components/LayerPanel.jsx';

export default function App() {
  const grid = useMemo(() => gridFromJson(demData), []);
  const [mode, setMode] = useState('walk');
  const [pair, setPair] = useState(true);
  const [baseId, setBaseId] = useState('viking');
  const [layerState, setLayerState] = useState(initialLayerState);
  const [active, setActive] = useState(WAYPOINTS.map(w => w.id));
  const [selected, setSelected] = useState(null);
  const [route, setRoute] = useState(null);
  const [hud, setHud] = useState(false);

  const wps = WAYPOINTS.filter(w => active.includes(w.id));
  const sel = WAYPOINTS.find(w => w.id === selected);
  const calc = () => setRoute(planRoute(grid, BASE, wps, mode, LIMITS));
  const toggle = (id) => { setActive(a => a.includes(id) ? a.filter(x => x !== id) : [...a, id]); setRoute(null); };

  if (hud) return <HUD route={route} waypoints={wps} limits={LIMITS} onExit={() => setHud(false)} />;

  return (
    <div className="app">
      <aside className="panel">
        <h1>AREO‑WALK <small>Marswalk Planner</small></h1>
        <p className="muted">{AREA.name}</p>
        {grid.synthetic
          ? <p className="warn">Terreno de ejemplo (sintético) — reemplazar por grid.json del HiRISE DTM</p>
          : <p className="muted">Terreno: {grid.meta.product}, malla de {grid.meta.cellSizeNorthSouthM} m</p>}

        <section><h3>1 · Misión</h3>
          <div className="row">
            {Object.entries({ walk: LIMITS.walk, rover: LIMITS.rover }).map(([k, v]) =>
              <button key={k} className={mode === k ? 'on' : ''} onClick={() => { setMode(k); setRoute(null); }}>{v.label}</button>)}
          </div>
          <label><input type="checkbox" checked={pair} onChange={e => setPair(e.target.checked)} /> Trabajo en pareja</label>
        </section>

        <section><h3>2 · Capas</h3>
          <LayerPanel baseId={baseId} setBaseId={setBaseId} state={layerState} setState={setLayerState} />
        </section>

        <section><h3>3 · Puntos científicos</h3>
          {WAYPOINTS.map((w, i) => (
            <label key={w.id} className="wp"><input type="checkbox" checked={active.includes(w.id)} onChange={() => toggle(w.id)} />
              <span onClick={() => setSelected(w.id)}>{i + 1}. {w.name}</span></label>))}
          <p className="warn">Puntos y base aproximados, sin validar. La ruta solo respeta la pendiente máxima a 25 m: no garantiza que el terreno sea seguro.</p>
          <button className="primary" onClick={calc}>Calcular ruta segura (A*)</button>
        </section>

        {route?.error && <p className="warn">{route.error}</p>}
        {route?.legs && <section><h3>4 · Seguridad</h3>
          <div className="kpis">
            <div><b>{route.distKm.toFixed(2)}</b> km</div>
            <div><b>{route.hours.toFixed(1)}</b> h EVA</div>
            <div><b>{route.dose.toFixed(1)}</b> µGy</div>
          </div>
          {route.warnings.length ? route.warnings.map(w => <p key={w} className="warn">⚠ {w}</p>) : <p className="ok">✓ Dentro de límites</p>}
          <Profile data={route.profile} />
          <button onClick={() => setHud(true)}>Abrir modo HUD ▶</button>
        </section>}

        {sel && <section className="card"><h3>{sel.name}</h3><p>{sel.task}</p>
          {sel.photo ? <img src={sel.photo} alt={sel.name} /> : <p className="muted">Agregar foto cruda de Curiosity en mission.js</p>}
        </section>}
      </aside>
      <main><MarsMap grid={grid} layerState={layerState} baseId={baseId} waypoints={wps}
        route={route?.legs ? route : null} selected={selected} onSelect={setSelected} /></main>
    </div>
  );
}
