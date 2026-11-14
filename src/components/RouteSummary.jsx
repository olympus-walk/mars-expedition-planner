import React, { useState } from 'react';
import Profile from './Profile.jsx';
import Icon from './Icon.jsx';
import { formatNumber } from '../lib/format.js';

function Stat({ label, value, unit, note, wide }) {
  return (
    <div className={`stat${wide ? ' stat-wide' : ''}`}>
      <dt>{label}</dt>
      <dd>{value}{unit && <small>{unit}</small>}</dd>
      {note && <dd className="stat-note">{note}</dd>}
    </div>
  );
}

export default function RouteSummary({ route, mode, limits, stops, onOpenHud }) {
  const [showProfile, setShowProfile] = useState(true);
  const maxSlope = Math.max(...route.legs.map(leg => leg.maxSlope));
  const lowest = Math.min(...route.profile);
  const highest = Math.max(...route.profile);

  return (
    <section className="dock" aria-label="Resumen de la ruta">
      <div className="dock-head">
        <h2>Ruta {limits[mode].label.toLowerCase()}</h2>
        <div className="dock-actions">
          <button className="button button-quiet" aria-expanded={showProfile} onClick={() => setShowProfile(v => !v)}>
            {showProfile ? 'Ocultar perfil' : 'Ver perfil'}
          </button>
          <button className="button" onClick={onOpenHud}>Abrir HUD</button>
        </div>
      </div>

      <div className="dock-body">
      <div className="dock-info">
      <dl className="stats">
        <Stat label="Distancia" value={route.distKm.toFixed(2)} unit="km" />
        <Stat label="Tiempo de EVA" value={route.hours.toFixed(1)} unit="h" note="Estimado" />
        <Stat label="Dosis" value={route.dose.toFixed(1)} unit="µGy" note="Estimada" />
        <Stat label="Pendiente máxima" value={`${maxSlope.toFixed(1)}°`} note={`Límite ${limits[mode].maxSlope}°, malla de 25 m`} />
        <Stat wide label="Elevación" value={`${formatNumber(lowest)} a ${formatNumber(highest)}`} unit="m" note="DEM de USGS" />
      </dl>

      <div className="dock-status">
        {route.warnings.length
          ? route.warnings.map(warning => <p key={warning} className="status status-warn"><Icon name="alert" size={16} />{warning}</p>)
          : <p className="status status-ok"><Icon name="check" size={16} />Dentro de los límites de EVA y dosis definidos</p>}
      </div>
      <p className="note">
        Base y paradas aproximadas. Tiempo de EVA, dosis y límites: supuestos de diseño no validados. La ruta no garantiza que el terreno sea seguro.
      </p>
      </div>

      {showProfile && <Profile route={route} stops={stops} />}
      </div>
    </section>
  );
}
