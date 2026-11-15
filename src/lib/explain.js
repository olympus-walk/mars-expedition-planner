const topics = [
  { id: 'safety', words: ['safe', 'safety', 'unsafe', 'danger', 'dangerous', 'risk', 'risky', 'hazard', 'hazards', 'certified', 'seguro', 'segura', 'peligro', 'peligroso'] },
  { id: 'limitations', words: ['limitation', 'limitations', 'assumption', 'assumptions', 'accurate', 'accuracy', 'reliable', 'uncertainty', 'limitaciones', 'supuestos'] },
  { id: 'why', words: ['why', 'reason', 'detour', 'direct', 'straight', 'por qué', 'porque'] },
  { id: 'elevation', words: ['elevation', 'elevations', 'altitude', 'height', 'elevación', 'altitud'] },
  { id: 'slope', words: ['slope', 'slopes', 'steep', 'steepest', 'hard', 'hardest', 'difficult', 'leg', 'pendiente', 'difícil'] },
  { id: 'time', words: ['eva', 'time', 'hour', 'hours', 'duration', 'how long', 'tiempo', 'hora', 'horas'] },
  { id: 'dose', words: ['dose', 'radiation', 'µgy', 'dosis', 'radiación'] },
  { id: 'summary', words: ['summary', 'overview', 'summarize', 'summarise', 'resumen'] },
  { id: 'greeting', words: ['hi', 'hello', 'hey', 'hola'] },
  { id: 'thanks', words: ['thanks', 'thank', 'thx', 'gracias'] },
  { id: 'help', words: ['help', 'what can you do', 'who are you', 'ayuda'] },
];

const examples = [
  'Why this route?',
  'Is this route safe?',
  'What is the elevation?',
  'What is the maximum slope?',
  'How long will the EVA take?',
  'What radiation dose will I get?',
  'What are the route limitations?',
];

const generalAnswers = {
  greeting: 'Hi! I explain the route you calculate: why it looks the way it does, its elevation, slope, EVA time, dose and limitations.',
  thanks: "You're welcome! Ask me anything else about the calculated route.",
  help: `I explain the calculated route using only its A* result and the mission assumptions.Answers use only the route data; an AI may rephrase them, and I can't certify that a route is safe. You can ask: ${examples.join(' ')}`,
  unknown: `I can't answer that. I only explain the calculated route, using its A* result and the mission assumptions. You can ask: ${examples.join(' ')}`,
};

export const quickQuestions = [
  'Why this route?',
  'Is this route safe?',
  'How long will the EVA take?',
  'What are the route limitations?',
];

const assumptionNote = 'EVA time, dose, speed and limits are illustrative design assumptions, not validated operational limits.';

function topicOf(question) {
  const text = ` ${(question.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).join(' ')} `;
  return topics.find(topic => topic.words.some(word => text.includes(` ${word} `)))?.id || 'unknown';
}

function warningsOf(f) {
  return f.warnings.length ? ` Warning: ${f.warnings.join('. ')}.` : '';
}

function answerFor(topic, f) {
  const mode = f.mode.toLowerCase();
  switch (topic) {
    case 'safety':
      return `No. Olympus Walk does not certify that this or any route is safe. A* only checks that each ${f.cellSizeM} m cell on the route is at or below the assumed ${f.slopeLimitDeg}° ${mode} slope limit; terrain features smaller than a cell are not represented, and base and stop positions are approximate.` +
        warningsOf(f) + ` ${assumptionNote}`;
    case 'limitations':
      return `Base and stop positions are approximate. Slopes come from the ${f.terrain} on ${f.cellSizeM} m cells, so smaller terrain features are not represented. ${assumptionNote} The route's planetary protection status has not been evaluated, and the route is not certified as safe.`;
    case 'why': {
      const blocked = f.straightTooSteepCells
        ? ` The straight lines between consecutive stops cross ${f.straightTooSteepCells} cells steeper than ${f.slopeLimitDeg}° (up to ${f.straightMaxSlopeDeg}°), which A* cannot use.`
        : ' The straight lines between consecutive stops have no cells above the limit; the extra distance comes from A* favoring gentler slopes and moving between grid cells in 8 directions.';
      const noData = f.straightNoDataCells ? ` They also cross ${f.straightNoDataCells} cells without valid elevation data, which A* excludes.` : '';
      return `A* only uses ${f.cellSizeM} m cells with slopes up to the assumed ${f.slopeLimitDeg}° ${mode} limit and, among them, favors gentler slopes.` +
        blocked + noData + ` The calculated route is ${f.routeKm} km, ${f.extraPct}% longer than the ${f.straightKm} km of those straight lines.` + warningsOf(f);
    }
    case 'elevation':
      return `Along the calculated route, the ${f.terrain} gives elevations from ${f.elevationMinM} m to ${f.elevationMaxM} m (${f.cellSizeM} m grid).`;
    case 'slope':
      return `The maximum slope on the route is ${f.routeMaxSlopeDeg}°, on the ${f.steepestLeg} leg, against the assumed ${f.slopeLimitDeg}° ${mode} limit. Slopes are derived from the ${f.terrain} on ${f.cellSizeM} m cells.`;
    case 'time':
      return `The EVA is estimated at ${f.evaHours} h: ${f.movingHours} h moving at an assumed ${f.speedKmh} km/h plus ${f.stopHours} h at ${f.stops} stops. ` +
        `That is ${f.overEvaLimit ? 'above' : 'within'} the assumed ${f.evaLimitHours} h EVA limit. ${assumptionNote}`;
    case 'dose':
      return `The estimated dose is ${f.doseMicroGy} µGy, ${f.overDoseLimit ? 'above' : 'within'} the assumed ${f.doseLimitMicroGy} µGy limit. ` +
        `It is the EVA time multiplied by an assumed ${f.doseRateMicroGyPerHour} µGy/h, not a measurement. ${assumptionNote}`;
    default:
      return `${f.mode} route: ${f.routeKm} km, maximum slope ${f.routeMaxSlopeDeg}° (assumed limit ${f.slopeLimitDeg}°), estimated EVA ${f.evaHours} h and dose ${f.doseMicroGy} µGy.` +
        warningsOf(f) + ' The route is not certified as safe.';
  }
}

export function generalAnswer(question) {
  const topic = topicOf(question);
  if (topic === 'unknown') return null;          // las preguntas libres van a la IA
  return generalAnswers[topic] || null;
}

export function templateAnswer(question, facts) {
  const topic = topicOf(question);
  return generalAnswers[topic] || answerFor(topic, facts);   // si la IA falla, "unknown" sigue con su mensaje
}

const numbersIn = (text) => text.match(/-?\d+(?:\.\d+)?/g) || [];
const decimalsOf = (value) => value.split('.')[1]?.length || 0;

export function numbersAreGrounded(text, facts) {
  const allowed = numbersIn(JSON.stringify(facts));
  return numbersIn(text).every(value => allowed.some(fact =>
    decimalsOf(value) >= Math.min(decimalsOf(fact), 1) && Number(Number(fact).toFixed(decimalsOf(value))) === Number(value)
  ));
}

export function mentionsSafety(text) {
  return /\b(safe|safely|safety|certif\w*|guarantee\w*)\b/i.test(text);
}


export function saysNoData(text) {
  return /don'?t have (that|this|the) data|no (tengo|data)|not (available|provided) in the data/i.test(text);
}