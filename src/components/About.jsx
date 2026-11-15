import React from 'react';
import Icon from './Icon.jsx';

const blocks = [
  {
    title: 'The challenge',
    body: <p>Planning a walk on Mars means matching where scientists want to go with the terrain, the time in a suit and the radiation dose. Olympus Walk is a prototype that explores how to do this in one place.</p>,
  },
  {
    title: 'Our solution',
    body: <p>The app works in Gale Crater, near Mount Sharp. It overlays NASA imagery on a real elevation grid, calculates a route between science stops with the A* algorithm, and shows the elevation profile, estimated EVA time and dose. A route assistant explains each result using only the calculated data.</p>,
  },
  {
    title: 'Target users',
    body: <p>Mission planners, planetary scientists, students and anyone curious about how a walk on Mars could be planned.</p>,
  },
  {
    title: 'Scientific data sources',
    body: (
      <ul className="pp-list">
        <li>Imagery: NASA/JPL Mars Trek (CTX, THEMIS, MOLA, Viking).</li>
        <li>Elevation: USGS MSL Gale DEM, resampled to a 25 m grid. Slopes are derived from it.</li>
        <li>Route planning: A* algorithm on that grid.</li>
        <li>Conditions: historical Curiosity REMS observations, not live data.</li>
        <li>Planetary protection: summary of COSPAR, NASA and National Academies sources.</li>
      </ul>
    ),
  },
  {
    title: 'Prototype limitations',
    body: (
      <ul className="pp-list">
        <li>The route does not certify that the terrain is safe. It only respects an assumed maximum slope on 25 m cells.</li>
        <li>Base and stops are approximate and unvalidated.</li>
        <li>EVA time, dose, speeds and limits are illustrative assumptions, not validated operational limits.</li>
        <li>THEMIS layers are infrared images, not numeric temperatures.</li>
        <li>There is no validated mineral layer.</li>
        <li>Planetary protection is not evaluated for the route.</li>
      </ul>
    ),
  },
];

export default function About() {
  return (
    <section aria-labelledby="about-title">
      <h2 id="about-title">About Olympus Walk</h2>
      {blocks.map(block => (
        <details key={block.title} className="pp-block">
          <summary>{block.title}<Icon name="chevron" size={16} /></summary>
          <div className="pp-body">{block.body}</div>
        </details>
      ))}
    </section>
  );
}
