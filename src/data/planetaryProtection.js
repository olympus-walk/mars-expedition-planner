const cosparPage = 'https://cosparhq.cnes.fr/cospar-policy-on-planetary-protection/';
const cosparPolicy = 'https://cosparhq.cnes.fr/assets/uploads/2026/01/SRT_224_Editorial_PPP-Nov-2025.pdf';
const unTreaties = 'https://digitallibrary.un.org/record/626736/files/st_space_11rev2E.pdf';
const nasaPage ='https://sma.nasa.gov/sma-disciplines/planetary-protection/';
const nationalAcademies = 'https://www.nationalacademies.org/read/21816/chapter/8';

export const routeStatus = 'Not evaluated';

export const framework = [
  {
    kind: 'International treaty',
    title: 'Outer Space Treaty (1967), Article IX',
    text: 'States Parties shall conduct exploration of outer space, including the Moon and other celestial bodies, so as to avoid their harmful contamination and adverse changes in the environment of the Earth, and shall adopt appropriate measures where necessary. It binds the States Parties to the treaty.',
    link: { label: 'UN Treaties and Principles on Outer Space (PDF)', url: unTreaties },
  },
  {
    kind: 'COSPAR recommendation',
    title: 'COSPAR Policy on Planetary Protection (2026 version)',
    text: 'COSPAR maintains it as an international voluntary and non-legally binding standard to guide compliance with the treaty.',
    link: { label: 'COSPAR policy (PDF)', url: cosparPolicy },
  },
  {
    kind: 'NASA policy',
    title: 'NPR 8715.24 (September 2021)',
    text: 'NASA requirements for its robotic extraterrestrial missions. NASA also lists directive NID 8715.129 on biological planetary protection for human missions to Mars.',
    link: { label: 'NASA Planetary Protection', url: nasaPage },
  },
];

export const specialRegions = {
  kind: 'COSPAR recommendation',
  definition: 'A region within which terrestrial organisms are likely to replicate. A region interpreted to have a high potential for extant Martian life is also a Special Region.',
  limits: [
    'Water activity above 0.5',
    'Temperature above −28 °C',
  ],
  limitsNote: 'COSPAR gives these lower limits for the replication of terrestrial microorganisms. Both must be met at the same time.',
  consequence: 'Missions that investigate Special Regions are Category IVc and face stricter sterilization requirements, according to COSPAR and NASA.',
  link: { label: 'COSPAR policy (PDF)', url: cosparPolicy },
  entries: [],
};

export const uncertainRegions = {
  kind: 'Scientific review',
  definition: 'Observed features with a significant but still unknown probability of association with liquid water. The National Academies 2015 review proposes treating them as Special Regions until proven otherwise.',
  note: 'The term comes from this review. It does not appear in the COSPAR 2026 policy text. Whoever proposes to investigate such a region must show, with the latest evidence, whether it is a Special Region.',
  featureTypes: [
    'Sources of methane, if identified',
    'Recurring slope lineae',
    'Gullies and bright streaks associated with gullies',
    'Pasted-on terrains',
    'Caves, subsurface cavities and subsurface below 5 m',
    'Others to be determined: dark slope streaks, possible geothermal sites, fresh craters with hydrothermal activity, modern outflow channels, sites of recent seismic activity',
  ],
  link: { label: 'National Academies review', url: nationalAcademies },
  entries: [],
};

export const precautions = [
  { term: 'Forward contamination', text: 'Transfer of viable organisms from Earth to another world. NASA controls it to protect the search for extraterrestrial life.' },
  { term: 'Backward contamination', text: 'Transfer of extraterrestrial organisms, if they exist, to Earth. NASA evaluates it only for missions that return material.' },
  { term: 'Spacecraft cleanliness', text: 'NASA requires every planetary mission to meet stringent biological cleanliness requirements during assembly and launch.' },
  { term: 'Human explorers', text: 'COSPAR says planetary protection goals should not be relaxed for human missions, and that human-associated contamination must be controlled and understood.' },
];

export const sources = [
  { label: 'United Nations Treaties and Principles on Outer Space (Outer Space Treaty, Article IX)', url: unTreaties },
  { label: 'COSPAR Policy on Planetary Protection', url: cosparPage },
  { label: 'NASA Planetary Protection', url: nasaPage },
  { label: 'National Academies: Review of the MEPAG Report on Mars Special Regions', url: nationalAcademies },
];
