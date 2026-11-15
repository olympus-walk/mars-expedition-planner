import React from 'react';
import Icon from './Icon.jsx';
import { routeStatus, framework, specialRegions, uncertainRegions, precautions, sources } from '../data/planetaryProtection.js';

function ExternalLink({ label, url }) {
  return <a href={url} target="_blank" rel="noreferrer">{label}</a>;
}

function Block({ title, children }) {
  return (
    <details className="pp-block">
      <summary>{title}<Icon name="chevron" size={16} /></summary>
      <div className="pp-body">{children}</div>
    </details>
  );
}

function Entries({ entries }) {
  if (!entries.length) {
    return <p className="note">No validated regions listed yet. Entries need coordinates and evidence from reviewed research.</p>;
  }
  return (
    <ul className="pp-list">
      {entries.map(entry => (
        <li key={entry.name}>
          <strong>{entry.name}</strong>: {entry.evidence} <ExternalLink label={entry.sourceLabel} url={entry.sourceUrl} />
        </li>
      ))}
    </ul>
  );
}

export default function PlanetaryProtection() {
  return (
    <section>
      <h2>Planetary protection</h2>
      <p className="caution">
        <Icon name="alert" size={18} />
        <span>
          <strong>Route planetary protection status: {routeStatus}.</strong>{' '}
          Olympus Walk does not classify Mars regions. It has not checked whether the base, stops or route enter, cross or avoid any Special or Uncertain Region.
        </span>
      </p>

      <Block title="Rules and recommendations">
        <p className="note">These sources have different standing: a treaty between States, an international voluntary standard and an agency policy.</p>
        <ul className="pp-list pp-plain">
          {framework.map(item => (
            <li key={item.title}>
              <span className="tag">{item.kind}</span>
              <strong>{item.title}</strong>
              <p>{item.text} <ExternalLink {...item.link} /></p>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Special Regions">
        <span className="tag">{specialRegions.kind}</span>
        <p>{specialRegions.definition}</p>
        <ul className="pp-list">
          {specialRegions.limits.map(limit => <li key={limit}>{limit}</li>)}
        </ul>
        <p className="note">{specialRegions.limitsNote}</p>
        <p>{specialRegions.consequence} <ExternalLink {...specialRegions.link} /></p>
        <Entries entries={specialRegions.entries} />
      </Block>

      <Block title="Uncertain Regions">
        <span className="tag">{uncertainRegions.kind}</span>
        <p>{uncertainRegions.definition}</p>
        <p className="note">{uncertainRegions.note}</p>
        <p>Feature types named in the review. These are not locations:</p>
        <ul className="pp-list">
          {uncertainRegions.featureTypes.map(type => <li key={type}>{type}</li>)}
        </ul>
        <p><ExternalLink {...uncertainRegions.link} /></p>
        <Entries entries={uncertainRegions.entries} />
      </Block>

      <Block title="Biological contamination precautions">
        <dl className="pp-terms">
          {precautions.map(item => (
            <div key={item.term}>
              <dt>{item.term}</dt>
              <dd>{item.text}</dd>
            </div>
          ))}
        </dl>
      </Block>

      <p className="note">
        Sources: {sources.map((source, i) => (
          <React.Fragment key={source.url}>{i > 0 && '; '}<ExternalLink {...source} /></React.Fragment>
        ))}.
      </p>
    </section>
  );
}
