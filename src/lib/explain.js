// Offline templates + number validator for the assistant.

const TOPICS = [
  { id: 'why',     words: ['why', 'por qué', 'porque', 'reason', 'detour', 'direct'] },
  { id: 'hardest', words: ['hard', 'difficult', 'steep', 'slope', 'leg', 'pendiente', 'difícil'] },
  { id: 'time',    words: ['time', 'hour', 'eva', 'return', 'make it', 'tiempo', 'hora'] },
  { id: 'dose',    words: ['dose', 'radiation', 'µgy', 'ugy', 'radiación', 'dosis'] },
];

export const QUICK_QUESTIONS = [
  'Why this route?',
  'Which is the hardest leg?',
  'Will I make it in time?',
  'What radiation dose will I get?',
];

function topicOf(question) {
  const q = question.toLowerCase();
  return TOPICS.find(t => t.words.some(w => q.includes(w)))?.id || 'summary';
}

// Answer built only from the fact sheet (always works, no internet)
export function templateAnswer(question, f) {
  const tail = f.synthetic_terrain ? ' (example terrain data)' : '';
  switch (topicOf(question)) {
    case 'why':
      return f.reasons.slice(0, -1).join('. ') + '.' + tail;
    case 'hardest':
      return `The hardest leg is ${f.hardest_leg}, with slopes up to ${f.hardest_leg_max_slope_deg}°. ` +
        `The ${f.mode.toLowerCase()} limit is ${f.slope_limit_deg}°.` + tail;
    case 'time':
      return f.eva_margin_hours >= 0
        ? `The EVA takes about ${f.eva_hours} h, within the assumed ${f.eva_limit_hours} h limit (${f.eva_margin_hours} h to spare).` + tail
        : `The EVA takes about ${f.eva_hours} h, above the assumed ${f.eva_limit_hours} h limit. Remove a stop or switch mode.` + tail;
    case 'dose':
      return `Estimated dose: ${f.dose_uGy} µGy, against an assumed limit of ${f.dose_limit_uGy} µGy.` + tail;
    default:
      return `Route: ${f.route_km} km, max slope ${f.route_max_slope_deg}°, about ${f.eva_hours} h.` + tail;
  }
}

// Every number in the answer must exist in the fact sheet
export function numbersAreGrounded(text, facts) {
  const nums = (s) => (s.match(/-?\d+(?:[.,]\d+)?/g) || []).map(n => parseFloat(n.replace(',', '.')));
  const allowed = nums(JSON.stringify(facts));
  return nums(text).every(n =>
    allowed.some(a => Math.abs(a - n) <= Math.max(0.051, Math.abs(a) * 0.01) || Math.round(a) === n)
  );
}