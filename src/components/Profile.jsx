import React, { useEffect, useMemo, useRef, useState } from 'react';
import { routeFractions, indexAtFraction } from '../lib/routeProgress.js';
import { formatNumber } from '../lib/format.js';

const HEIGHT = 184;
const MARGIN = { top: 42, right: 16, bottom: 32, left: 58 };
const PIN_Y = MARGIN.top - 13;

function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(600);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

function tickStep(span, maxTicks, steps) {
  return steps.find(step => span / step <= maxTicks) ?? steps[steps.length - 1];
}

function ticksBetween(start, end, step) {
  const ticks = [];
  for (let value = start; value <= end + step / 1000; value += step) ticks.push(value);
  return ticks;
}

export default function Profile({ route, stops = [], progress }) {
  const [ref, width] = useWidth();
  const [hoverIndex, setHoverIndex] = useState(null);
  const fractions = useMemo(() => routeFractions(route.latlngs), [route]);

  const elevations = route.profile;
  const lowest = Math.min(...elevations);
  const highest = Math.max(...elevations);
  const yStep = tickStep(highest - lowest, 4, [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000]);
  const yMin = Math.floor(lowest / yStep) * yStep;
  const yMax = Math.max(Math.ceil(highest / yStep) * yStep, yMin + yStep);
  const kmStep = tickStep(route.distKm, width < 460 ? 4 : 8, [0.25, 0.5, 1, 2, 5, 10, 20]);

  const innerWidth = Math.max(width - MARGIN.left - MARGIN.right, 60);
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const bottom = MARGIN.top + innerHeight;
  const x = (fraction) => MARGIN.left + fraction * innerWidth;
  const y = (elevation) => MARGIN.top + (1 - (elevation - yMin) / (yMax - yMin)) * innerHeight;

  const line = elevations.map((elevation, i) => `${x(fractions[i]).toFixed(1)},${y(elevation).toFixed(1)}`).join(' ');

  const stopMarks = [];
  let lastIndex = -1;
  route.legs.slice(0, -1).forEach((leg, k) => {
    lastIndex += leg.latlngs.length;
    stopMarks.push({ fraction: fractions[lastIndex], label: stops[k] });
  });

  const handleMove = (event) => {
    const box = event.currentTarget.getBoundingClientRect();
    const fraction = (event.clientX - box.left - MARGIN.left) / innerWidth;
    setHoverIndex(indexAtFraction(fractions, Math.min(1, Math.max(0, fraction))));
  };

  const markerIndex = hoverIndex ?? (progress == null ? null : indexAtFraction(fractions, progress));
  const summary = `Perfil de elevación de la ruta: de ${formatNumber(lowest)} a ${formatNumber(highest)} metros a lo largo de ${route.distKm.toFixed(2)} kilómetros`;

  return (
    <div ref={ref} className="profile">
      <svg width={width} height={HEIGHT} role="img" aria-label={summary}
        onPointerMove={handleMove} onPointerLeave={() => setHoverIndex(null)}>
        {(markerIndex == null || width >= 460) &&
          <text className="axis-title" x={MARGIN.left} y={12}>Elevación (m, DEM de USGS)</text>}

        {ticksBetween(yMin, yMax, yStep).map(value => (
          <g key={value}>
            <line className="grid-line" x1={MARGIN.left} x2={MARGIN.left + innerWidth} y1={y(value)} y2={y(value)} />
            <text className="tick" x={MARGIN.left - 8} y={y(value) + 4} textAnchor="end">{formatNumber(value)}</text>
          </g>
        ))}

        {ticksBetween(0, route.distKm, kmStep).map(km => (
          <g key={km}>
            <line className="axis-mark" x1={x(km / route.distKm)} x2={x(km / route.distKm)} y1={bottom} y2={bottom + 4} />
            <text className="tick" x={x(km / route.distKm)} y={bottom + 16} textAnchor="middle">{km}</text>
          </g>
        ))}
        <text className="axis-title" x={MARGIN.left + innerWidth} y={HEIGHT - 2} textAnchor="end">Distancia (km)</text>

        <polygon className="area" points={`${x(0)},${bottom} ${line} ${x(1)},${bottom}`} />
        <polyline className="line" points={line} />

        {[0, 1].map(fraction => (
          <g key={fraction}>
            <rect className="pin-base" x={x(fraction) - 8} y={PIN_Y - 8} width="16" height="16" rx="3" />
            <text className="pin-text" x={x(fraction)} y={PIN_Y + 4} textAnchor="middle">B</text>
          </g>
        ))}
        {stopMarks.map(mark => (
          <g key={mark.label}>
            <line className="stop-mark" x1={x(mark.fraction)} x2={x(mark.fraction)} y1={MARGIN.top} y2={bottom} />
            <circle className="pin-stop" cx={x(mark.fraction)} cy={PIN_Y} r="8.5" />
            <text className="pin-text" x={x(mark.fraction)} y={PIN_Y + 4} textAnchor="middle">{mark.label}</text>
          </g>
        ))}

        {markerIndex != null && (
          <g>
            <line className="cursor-line" x1={x(fractions[markerIndex])} x2={x(fractions[markerIndex])} y1={MARGIN.top} y2={bottom} />
            <circle className="cursor-dot" cx={x(fractions[markerIndex])} cy={y(elevations[markerIndex])} r="4" />
            <text className="readout" x={MARGIN.left + innerWidth} y={12} textAnchor="end">
              {(fractions[markerIndex] * route.distKm).toFixed(2)} km, {formatNumber(elevations[markerIndex], 1)} m
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
