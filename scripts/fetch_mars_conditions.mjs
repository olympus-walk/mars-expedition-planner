// Descarga el feed público de REMS (Curiosity) y guarda la última observación válida.
// Uso: node scripts/fetch_mars_conditions.mjs
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const feedUrl = 'https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json';
const outputUrl = new URL('../src/data/marsConditions.json', import.meta.url);

const toNumber = (value) => (value === '--' || value === '' || value == null ? null : Number(value));
const isNumber = (value) => Number.isFinite(value);

const response = await fetch(feedUrl, { headers: { 'User-Agent': 'olympus-walk-data-script' } });
if (!response.ok) throw new Error(`Feed responded ${response.status}`);
const text = await response.text();
const { soles, descriptions } = JSON.parse(text);

const latest = soles.find(sol =>
  isNumber(toNumber(sol.min_temp)) && isNumber(toNumber(sol.max_temp)) && isNumber(toNumber(sol.pressure)));
if (!latest) throw new Error('No sol with air temperature and pressure');

const airMin = toNumber(latest.min_temp);
const airMax = toNumber(latest.max_temp);
const groundMin = toNumber(latest.min_gts_temp);
const groundMax = toNumber(latest.max_gts_temp);
if (airMin > airMax) throw new Error(`Air temperature min > max on sol ${latest.sol}`);
if (isNumber(groundMin) && isNumber(groundMax) && groundMin > groundMax) throw new Error(`Ground temperature min > max on sol ${latest.sol}`);

const windSols = soles.filter(sol => sol.wind_speed !== '--').length;
const opacityLabels = [...new Set(soles.map(sol => sol.atmo_opacity))].filter(label => label !== '--');

const data = {
  source: {
    name: 'REMS weather feed (Centro de Astrobiología, CSIC-INTA, published by NASA)',
    url: feedUrl,
    scienceArchive: 'https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/MARS/curiosity/rems.html',
    disclaimer: descriptions.disclaimer_en.replace(/\s+/g, ' ').trim(),
    units: 'Temperature in °C and pressure in Pa, as labelled by NASA\'s Curiosity weather widget that reads this feed',
    fetchedAt: new Date().toISOString(),
    sha256: createHash('sha256').update(text).digest('hex'),
    solsInFeed: soles.length,
    latestSolInFeed: Number(soles[0].sol),
  },
  observation: {
    status: 'historical',
    mission: 'Mars Science Laboratory (Curiosity rover)',
    instrument: 'Rover Environmental Monitoring Station (REMS)',
    location: 'Gale Crater, at the rover position',
    sol: Number(latest.sol),
    earthDate: latest.terrestrial_date,
    solarLongitude: toNumber(latest.ls),
    airTemperatureC: { min: airMin, max: airMax },
    groundTemperatureC: isNumber(groundMin) && isNumber(groundMax) ? { min: groundMin, max: groundMax } : null,
    pressurePa: toNumber(latest.pressure),
    wind: null,
    dust: null,
  },
  unavailable: {
    wind: `The feed has wind values in ${windSols} of its ${soles.length} sols.`,
    dust: `The feed has no dust opacity measurement: its atmo_opacity field only contains the label ${opacityLabels.map(label => `"${label}"`).join(', ')}.`,
  },
};

writeFileSync(outputUrl, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Sol ${data.observation.sol} (${data.observation.earthDate}): air ${airMin} to ${airMax} °C, ground ${groundMin} to ${groundMax} °C, ${data.observation.pressurePa} Pa`);
console.log(`Wind values: ${windSols}. Opacity labels: ${opacityLabels.join(', ')}`);
