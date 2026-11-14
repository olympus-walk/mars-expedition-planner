import React from 'react';
import { LAYERS } from '../data/layers.js';

const provenanceLabels = { real: 'Real', derived: 'Derivado', synthetic: 'Simulado' };
const baseLayers = LAYERS.filter(l => l.type === 'tile');
const overlays = LAYERS.filter(l => l.type !== 'tile');

function ProvenanceTag({ value }) {
  if (!provenanceLabels[value]) return null;
  return <span className={`tag tag-${value}`}>{provenanceLabels[value]}</span>;
}

export default function LayerPanel({ baseId, setBaseId, state, setState, recommendedId }) {
  const update = (id, patch) => setState(s => ({ ...s, [id]: { ...s[id], ...patch } }));

  const renderBase = (layer) => {
    const checked = baseId === layer.id;
    return (
      <label key={layer.id} className={`option${checked ? ' is-on' : ''}`}>
        <input type="radio" name="base" checked={checked} onChange={() => setBaseId(layer.id)} />
        <span className="option-body">
          <span className="option-title">{layer.name}</span>
          <span className="option-source">{layer.detail}, {layer.resolution}</span>
        </span>
        {layer.id === recommendedId && <span className="option-hint">Recomendada</span>}
        {layer.provenance !== 'real' && <ProvenanceTag value={layer.provenance} />}
      </label>
    );
  };

  const renderOverlay = (layer) => {
    const { visible, opacity } = state[layer.id];
    return (
      <div key={layer.id} className={`option-block${visible ? ' is-on' : ''}`}>
        <label className="option">
          <input type="checkbox" checked={visible} onChange={e => update(layer.id, { visible: e.target.checked })} />
          <span className="option-body">
            <span className="option-title">{layer.name}</span>
            {visible && <span className="option-source">{layer.source}</span>}
          </span>
          <ProvenanceTag value={layer.provenance} />
        </label>
        {visible && layer.type !== 'line' && (
          <label className="opacity">
            <span>Opacidad</span>
            <input type="range" min="0" max="1" step="0.05" value={opacity}
              onChange={e => update(layer.id, { opacity: +e.target.value })} />
            <output>{Math.round(opacity * 100)} %</output>
          </label>
        )}
        {visible && layer.legend && (
          <ul className="legend">
            {layer.legend.map(([color, text]) => (
              <li key={text}><i style={{ background: color }} />{text}</li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="layers">
      <fieldset className="layer-group">
        <legend>Mapa base <ProvenanceTag value="real" /></legend>
        {baseLayers.map(renderBase)}
      </fieldset>
      <fieldset className="layer-group">
        <legend>Sobre el mapa</legend>
        {overlays.map(renderOverlay)}
      </fieldset>
    </div>
  );
}
