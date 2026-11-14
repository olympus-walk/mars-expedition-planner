import React from 'react';
import { AREA, WAYPOINTS, LIMITS } from '../data/mission.js';
import { LAYERS } from '../data/layers.js';

export default function Welcome({ onStart }) {
  const capas = LAYERS.filter(l => l.type !== 'tile').length;
  const lat = Math.abs(AREA.center[0]).toFixed(1);
  const lon = AREA.center[1].toFixed(1);

  return (
    <div className="welcome">
      <div className="stars" />

      <div className="w-left">
        
        <h1>Olympus<span>‑</span>Walk</h1>
        <p className="subtitle">Rutas seguras para caminar sobre Marte</p>
        <button type="button" className="start" onClick={onStart}>
          Explorar ▶
        </button>
      </div>

      <div className="w-right">
        <div className="orbit"><i /></div>
        <div className="mars">
          <div className="mars-surface" />
          <div className="mars-shade" />
        </div>

        <div className="chip c1"><b>Gale · Mt Sharp</b><span>{lat}°S {lon}°E</span></div>
        <div className="chip c2"><b>{WAYPOINTS.length}</b><span>objetivos científicos</span></div>
        <div className="chip c3"><b>{capas}</b><span>capas de datos</span></div>
        <div className="chip c4"><b>{LIMITS.maxEvaHours} h</b><span>EVA máxima</span></div>
      </div>
    </div>
  );
}