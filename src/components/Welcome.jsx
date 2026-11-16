import React from 'react';
import { AREA, WAYPOINTS, LIMITS } from '../data/mission.js';
import * as layersData from '../data/layers.js';

export default function Welcome({ onStart }) {
  const layers = (layersData.LAYERS || []).filter(l => l.type !== 'tile').length;
  const lat = Math.abs(AREA.center[0]).toFixed(1);
  const lon = AREA.center[1].toFixed(1);

  return (
    <div className="welcome">
      <div className="stars" />

      <div className="w-left">
        <span className="badge">NASA Space Apps Challenge</span>
        <div className="welcome-logo-main">
          <img
            src="../../public/logo/logo-completo.png"
            alt="Olympus Walk"
          />
        </div>
        <p className="subtitle">Plan safer Marswalks with layered NASA data</p>
        <button type="button" className="start" onClick={onStart}>
          Start mission ▶
        </button>
      </div>

      <div className="w-right">
        <div className="orbit"><i /></div>
        <div className="mars">
          <div className="mars-surface" />
          <div className="mars-shade" />
        </div>

        <div className="chip c1"><b>Gale · Mt Sharp</b><span>{lat}°S {lon}°E</span></div>
        <div className="chip c2"><b>{WAYPOINTS.length}</b><span>science stops</span></div>
        {layers > 0 && <div className="chip c3"><b>{layers}</b><span>data layers</span></div>}
        <div className="chip c4"><b>{LIMITS.maxEvaHours} h</b><span>max EVA (assumed)</span></div>
      </div>
    </div>
  );
}