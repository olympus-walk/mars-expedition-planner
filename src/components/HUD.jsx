import React, { useEffect, useMemo, useState } from 'react';
import Profile from './Profile.jsx';
import Icon from './Icon.jsx';
import { routeFractions, indexAtFraction } from '../lib/routeProgress.js';
import { formatNumber } from '../lib/format.js';

const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

function bearingDegrees([lat0, lon0], [lat1, lon1]) {
  const east = (lon1 - lon0) * Math.cos(lat0 * Math.PI / 180);
  const north = lat1 - lat0;
  return (Math.atan2(east, north) * 180 / Math.PI + 360) % 360;
}

function legAtDistance(route, km) {
  let covered = 0;
  for (const leg of route.legs) {
    covered += leg.distKm;
    if (covered >= km) return leg;
  }
  return route.legs[route.legs.length - 1];
}

function Readout({ label, value, unit, note }) {
  return (
    <div className="hud-readout">
      <dt>{label}</dt>
      <dd>{value}{unit && <small>{unit}</small>}</dd>
      {note && <dd className="hud-note">{note}</dd>}
    </div>
  );
}

// Simulación del visor del casco: avanza sobre la ruta calculada.
export default function HUD({ route, stops, limits, onExit }) {
  const [t, setT] = useState(0); // 0..1 progreso
  const [isPlaying, setIsPlaying] = useState(true);
  const fractions = useMemo(() => route?.latlngs ? routeFractions(route.latlngs) : [], [route]);

  useEffect(() => {
    if (!isPlaying) return undefined;
    const id = setInterval(() => setT(v => Math.min(1, v + 0.004)), 200);
    return () => clearInterval(id);
  }, [isPlaying]);

  if (!route?.latlngs) {
    return (
      <div className="hud hud-empty">
        <p>Calcula una ruta antes de abrir el HUD.</p>
        <button className="button" onClick={onExit}>Volver al mapa</button>
      </div>
    );
  }

  const hours = route.hours * t, dose = route.dose * t;
  const remainKm = route.distKm * (1 - t);
  const leg = legAtDistance(route, route.distKm * t);
  const index = indexAtFraction(fractions, t);
  const bearing = bearingDegrees(route.latlngs[index], leg.latlngs[leg.latlngs.length - 1]);
  const mustReturn = hours > limits.maxEvaHours * 0.7 || dose > limits.maxEvaDoseMicroGy * 0.7;

  return (
    <div className="hud">
      <header className="hud-head">
        <div>
          <h1>HUD de exploración</h1>
          <p>Simulación del recorrido sobre la ruta calculada, con base y paradas aproximadas. No son datos en vivo.</p>
        </div>
        <button className="button" onClick={onExit}>Salir del HUD</button>
      </header>

      <dl className="hud-readouts">
        <Readout label="Tiempo de EVA" value={hours.toFixed(2)} unit="h" note="Estimado" />
        <Readout label="Dosis acumulada" value={dose.toFixed(1)} unit="µGy" note="Estimada" />
        <Readout label="Oxígeno" value={(100 - t * 70).toFixed(0)} unit="%" note="Simulado, sin modelo real" />
        <Readout label="Elevación" value={formatNumber(route.profile[index])} unit="m" note="DEM de USGS" />
        <Readout label="Distancia restante" value={remainKm.toFixed(2)} unit="km" />
      </dl>

      <div className="hud-heading">
        <div className="compass" aria-hidden="true">
          <span className="compass-north">N</span>
          <span className="compass-arrow" style={{ transform: `rotate(${bearing}deg)` }}><Icon name="arrow" size={56} /></span>
        </div>
        <div>
          <p className="hud-leg-label">Tramo actual</p>
          <h2>{leg.from} a {leg.to}</h2>
          <p>Rumbo a la siguiente parada: {bearing.toFixed(0)}° {cardinals[Math.round(bearing / 45) % 8]}</p>
          <p>Pendiente máxima del tramo: {leg.maxSlope.toFixed(0)}° (malla de 25 m)</p>
        </div>
      </div>

      {mustReturn && (
        <p className="hud-alert" role="alert">
          <Icon name="alert" size={20} />
          Punto de no retorno cercano: se superó el 70 % del límite de EVA o de dosis. Iniciar regreso. (Aviso simulado)
        </p>
      )}

      <Profile route={route} stops={stops} progress={t} />

      <div className="hud-controls">
        <button className="button button-icon" onClick={() => setIsPlaying(v => !v)}
          aria-label={isPlaying ? 'Pausar simulación' : 'Reanudar simulación'}>
          <Icon name={isPlaying ? 'pause' : 'play'} />
        </button>
        <input type="range" min="0" max="1" step="0.01" value={t} aria-label="Progreso del recorrido"
          onChange={e => setT(+e.target.value)} />
        <output>{Math.round(t * 100)} %</output>
      </div>
    </div>
  );
}
