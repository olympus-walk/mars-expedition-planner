import React from 'react';
import conditions from '../data/marsConditions.json';
import { formatNumber } from '../lib/format.js';

const unavailable = <span className="unavailable">Data unavailable</span>;

function range(values, unit) {
  if (!values) return unavailable;
  return `${formatNumber(values.min)} to ${formatNumber(values.max)} ${unit}`;
}

function earthDate(isoDate) {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export default function MarsConditions() {
  const { observation, source } = conditions;

  return (
    <section>
      <h2>Mars conditions</h2>
      <p className="conditions-site">Curiosity REMS, Gale Crater</p>
      <p className="note">
        Sol {observation.sol} ({earthDate(observation.earthDate)}), the latest sol with data in the public REMS feed.
        Historical measurement, not live.
      </p>
      <dl className="facts">
        <div><dt>Air temperature</dt><dd>{range(observation.airTemperatureC, '°C')}</dd></div>
        <div><dt>Ground temperature</dt><dd>{range(observation.groundTemperatureC, '°C')}</dd></div>
        <div>
          <dt>Pressure</dt>
          <dd>{observation.pressurePa == null ? unavailable : `${formatNumber(observation.pressurePa)} Pa`}</dd>
        </div>
        <div><dt>Wind</dt><dd>{unavailable}</dd></div>
        <div><dt>Dust</dt><dd>{unavailable}</dd></div>
      </dl>
      <p className="note">
        Daily minimum and maximum at the rover, which can influence the readings. The feed is processed by
        Centro de Astrobiología for outreach and has no wind or dust opacity values.{' '}
        <a href={source.url} target="_blank" rel="noreferrer">Source feed</a>,{' '}
        <a href={source.scienceArchive} target="_blank" rel="noreferrer">REMS science archive (PDS)</a>.
      </p>
    </section>
  );
}
