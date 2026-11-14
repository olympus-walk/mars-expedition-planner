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
    <section className="dock" aria-label="Route summary">
      <div className="dock-head">
        <h2>{limits[mode].label} route</h2>
        <div className="dock-status">
          {route.warnings.length
            ? route.warnings.map(warning => <p key={warning} className="status status-warn"><Icon name="alert" size={16} />{warning}</p>)
            : <p className="status status-ok"><Icon name="check" size={16} />Within the assumed EVA and dose limits</p>}
        </div>
        <div className="dock-actions">
          <button className="button button-quiet" aria-expanded={showProfile} onClick={() => setShowProfile(v => !v)}>
            {showProfile ? 'Hide profile' : 'Show profile'}
          </button>
          <button className="button" onClick={onOpenHud}>Open HUD</button>
        </div>
      </div>

      <div className="dock-body">
        <div className="dock-info">
          <dl className="stats">
            <Stat label="Distance" value={route.distKm.toFixed(2)} unit="km" />
            <Stat label="EVA time" value={route.hours.toFixed(1)} unit="h" note="Estimated" />
            <Stat label="Dose" value={route.dose.toFixed(1)} unit="µGy" note="Estimated" />
            <Stat label="Maximum slope" value={`${maxSlope.toFixed(1)}°`} note={`Assumed limit ${limits[mode].maxSlope}°`} />
            <Stat wide label="Elevation" value={`${formatNumber(lowest)} to ${formatNumber(highest)}`} unit="m" note="USGS DEM, 25 m grid" />
          </dl>
          <p className="note">
            Base and stops are approximate. EVA time, dose and limits are illustrative assumptions, not validated operational limits. The route does not certify that the terrain is safe.
          </p>
        </div>
        {showProfile && <Profile route={route} stops={stops} />}
      </div>
    </section>
  );
}
