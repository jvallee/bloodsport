// Generated portraits: a small SVG face for each fighter, drawn from their kind, humor, class and history.
// Cosmetic only: uses its own hash of the fighter's name, never the game's RNG. Pure.

const hash = (str) => [...str].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261);
function picker(seed) {
  let s = seed || 1;
  return (list) => {
    s = Math.imul(s ^ (s >>> 15), 2246822507) >>> 0;
    s = Math.imul(s ^ (s >>> 13), 3266489909) >>> 0;
    return list[(s >>> 0) % list.length];
  };
}

const SKIN = {
  human: ['#f1c9a5', '#d9a47c', '#b07a52', '#8a5a3b', '#5e3b26'],
  elf: ['#f3e2c7', '#e7d3b0', '#d8c7a6', '#c9b8e0'],
  orc: ['#7d9a5a', '#6b8a4c', '#8a9a6a', '#5f7a52'],
  android: ['#a9b4bf', '#c2c8cf', '#8e99a4'],
  vampire: ['#e8e4ec', '#d9d2e0', '#cfc9d8'],
  basa: ['#9a6b3a', '#7d5530', '#b08050'],
  revenant: ['#9aa394', '#8a9188', '#a7a398'], // 5.3.0: grave-grey, raised by the Temple of Vulcan
};
const HAIR = ['#1f1612', '#3a2618', '#6b4426', '#a8742f', '#d8c08a', '#8b2b22', '#cfcfcf'];
const BG = { human: '#3a2a20', elf: '#26332a', orc: '#2f2a1d', android: '#22283a', vampire: '#2a1a2a', basa: '#2e2414', revenant: '#1e1a16' };

// Brows and mouth by humor: Choleric scowls, Sanguine grins, Melancholic frowns, Phlegmatic is unreadable.
const FACE = {
  choleric: { brows: 'M19 25 L28 28 M45 25 L36 28', mouth: 'M26 47 Q32 44 38 47' },
  sanguine: { brows: 'M19 26 Q23 23 28 25 M36 25 Q41 23 45 26', mouth: 'M25 45 Q32 51 39 45' },
  melancholic: { brows: 'M19 27 L28 25 M36 25 L45 27', mouth: 'M26 48 Q32 45 38 48' },
  phlegmatic: { brows: 'M19 26 L28 26 M36 26 L45 26', mouth: 'M27 47 L37 47' },
};

function hairShape(style, color) {
  switch (style) {
    case 'short': return `<path d="M15 26 Q16 11 32 10 Q48 11 49 26 Q45 17 32 16 Q19 17 15 26Z" fill="${color}"/>`;
    case 'long': return `<path d="M13 40 Q11 12 32 9 Q53 12 51 40 L49 30 Q46 16 32 15 Q18 16 15 30Z" fill="${color}"/>`;
    case 'mohawk': return `<path d="M28 18 L30 5 L34 5 L36 18Z" fill="${color}"/>`;
    case 'topknot': return `<circle cx="32" cy="8" r="5" fill="${color}"/><path d="M16 24 Q18 12 32 11 Q46 12 48 24 Q44 16 32 16 Q20 16 16 24Z" fill="${color}"/>`;
    default: return '';
  }
}

// Class gear drawn over the head or shoulders.
function classGear(f) {
  if (f.cls === 'sagittarius') return '<path d="M10 44 Q8 8 32 6 Q56 8 54 44 L50 44 Q50 14 32 13 Q14 14 14 44Z" fill="#3e4a32" opacity="0.95"/>';
  if (f.cls === 'cestus') return '<rect x="15" y="19" width="34" height="4" rx="2" fill="#a8302a"/>';
  if (f.cls === 'ornitharius') return '<path d="M47 16 Q58 4 54 20 Q52 14 47 16Z" fill="#d9b45a"/>';
  if (f.cls === 'fighter') return '<path d="M16 22 Q16 9 32 8 Q48 9 48 22 L44 22 Q43 14 32 13 Q21 14 20 22Z" fill="#8a7a5a"/><path d="M30 3 L34 3 L33 10 L31 10Z" fill="#a8302a"/>';
  if (f.cls === 'retiarius') return '<path d="M8 54 Q14 42 22 46 L20 62 L8 62Z" fill="#7c8791" stroke="#b5c0c9" stroke-width="1"/><path d="M44 52 L56 60 M48 48 L56 54 M44 58 L54 50" stroke="#c9b48a" stroke-width="1.2" opacity="0.85"/>';
  if (f.cls === 'ashHungry') return '<path d="M17 22 Q32 16 47 22" stroke="#e0603c" stroke-width="2.5" fill="none"/><path d="M29 19 L32 11 L35 19Z" fill="#ff9a3c"/>';
  if (f.cls === 'bloodBearer') return '<path d="M16 20 Q32 15 48 20 L48 24 Q32 19 16 24Z" fill="#8f2420"/><path d="M24 17 L27 24 M37 24 L40 17" stroke="#e0b86a" stroke-width="1.4"/>';
  if (f.cls === 'thornBlade') return '<path d="M16 21 Q32 13 48 21" stroke="#5b7a52" stroke-width="2.2" fill="none"/><path d="M21 18 L19 12 M32 15 L32 9 M43 18 L45 12" stroke="#8ab07a" stroke-width="1.6" stroke-linecap="round"/>';
  if (f.cls === 'samnite') return '<path d="M14 25 Q14 8 32 7 Q50 8 50 25 L46 25 Q45 14 32 13 Q19 14 18 25Z" fill="#9c7a3c"/><path d="M26 7 Q32 1 38 7 L36 12 L28 12Z" fill="#c0362c"/><path d="M15 24 L15 36 L19 34 L19 24Z M49 24 L49 36 L45 34 L45 24Z" fill="#7d612e"/>';
  return '';
}

export function portrait(f, size = 48) {
  const pick = picker(hash(String(f.portraitSeed ?? f.id ?? f.name ?? '')));
  const kind = SKIN[f.kind] ? f.kind : 'human';
  const skin = pick(SKIN[kind]);
  const hair = pick(HAIR);
  const style = kind === 'android' ? 'none' : pick(['short', 'long', 'mohawk', 'topknot', 'none', 'short']);
  const face = FACE[f.humor] ?? FACE.phlegmatic;
  const eyeColor = kind === 'elf' ? pick(['#5fae8a', '#7aa6d8', '#c9a640']) : pick(['#3a2618', '#2c3e50', '#4a5a2a']);
  const parts = [`<rect width="64" height="64" rx="10" fill="${BG[kind]}"/>`];
  if (f.titles?.length) parts.push('<path d="M10 40 Q6 20 18 8 M54 40 Q58 20 46 8" stroke="#d9b45a" stroke-width="2.5" fill="none" stroke-dasharray="3 2"/>');
  // Ears go behind the head (Basa ears are drawn on top of the head).
  if (kind === 'elf') parts.push(`<path d="M15 30 L5 18 L17 26Z M49 30 L59 18 L47 26Z" fill="${skin}"/>`);
  else if (kind !== 'basa') parts.push(`<ellipse cx="15" cy="33" rx="3" ry="5" fill="${skin}"/><ellipse cx="49" cy="33" rx="3" ry="5" fill="${skin}"/>`);
  // Neck and shoulders, then the head.
  parts.push(`<path d="M24 50 L24 58 Q32 62 40 58 L40 50Z" fill="${skin}"/><path d="M8 64 Q12 54 32 56 Q52 54 56 64Z" fill="#4a3628"/>`);
  if (kind === 'android') {
    parts.push(`<rect x="15" y="12" width="34" height="40" rx="9" fill="${skin}"/><path d="M20 18 L44 18 M32 12 L32 18" stroke="#6b7682" stroke-width="1.2"/>`);
    parts.push('<rect x="18" y="28" width="28" height="7" rx="3.5" fill="#0d1520"/><rect x="21" y="30" width="22" height="3" rx="1.5" fill="#6fd3ff" opacity="0.9"/>');
    parts.push(`<path d="${face.mouth}" stroke="#3b4652" stroke-width="2" fill="none"/>`);
  } else {
    const jaw = kind === 'orc' ? 'M14 30 Q14 12 32 11 Q50 12 50 30 L50 40 Q48 54 32 55 Q16 54 14 40Z' : 'M16 30 Q16 11 32 11 Q48 11 48 30 Q48 50 32 53 Q16 50 16 30Z';
    parts.push(`<path d="${jaw}" fill="${skin}"/>`);
    parts.push(hairShape(style, hair));
    parts.push(`<ellipse cx="24" cy="32" rx="3.2" ry="2.6" fill="#fff"/><ellipse cx="40" cy="32" rx="3.2" ry="2.6" fill="#fff"/><circle cx="24" cy="32" r="1.7" fill="${eyeColor}"/><circle cx="40" cy="32" r="1.7" fill="${eyeColor}"/>`);
    parts.push(`<path d="${face.brows}" stroke="#2a1d16" stroke-width="2" stroke-linecap="round" fill="none"/>`);
    parts.push(`<path d="M32 34 L30 41 L33 41" stroke="rgba(0,0,0,0.25)" stroke-width="1.3" fill="none"/>`);
    parts.push(`<path d="${face.mouth}" stroke="#5a2a22" stroke-width="2" stroke-linecap="round" fill="none"/>`);
    if (kind === 'orc') parts.push('<path d="M25 47 L24 41 L27 46Z M39 47 L40 41 L37 46Z" fill="#f2ead2"/>');
    if (kind === 'vampire') parts.push('<path d="M28 47 L29 51 L30 47Z M34 47 L35 51 L36 47Z" fill="#fff"/><circle cx="24" cy="32" r="1.7" fill="#c0362c"/><circle cx="40" cy="32" r="1.7" fill="#c0362c"/>');
    if (kind === 'revenant') parts.push('<path d="M32 38 L48 34 Q48 50 32 53Z" fill="#b5883a" opacity="0.92"/><circle cx="41" cy="44" r="1.2" fill="#6b4a1e"/><circle cx="36" cy="49" r="1.2" fill="#6b4a1e"/><path d="M19 21 L45 21 M22 19 L22 23 M28 19 L28 23 M34 19 L34 23 M40 19 L40 23" stroke="#3a2e28" stroke-width="1.2"/><circle cx="24" cy="32" r="1.9" fill="#ff8a2a"/><circle cx="40" cy="32" r="1.9" fill="#ff8a2a"/>');
    if (kind === 'basa') parts.push('<path d="M14 22 L10 8 L22 16Z M50 22 L54 8 L42 16Z" fill="#5a3d20"/><path d="M26 40 L32 44 L38 40" stroke="#2a1d16" stroke-width="2" fill="none"/>');
  }
  parts.push(classGear(f));
  // Wounds: a red slash for each current injury (up to three).
  const slashes = ['M20 20 L27 27', 'M41 38 L46 45', 'M18 41 L24 37'];
  (f.injuries ?? []).slice(0, 3).forEach((_, i) => parts.push(`<path d="${slashes[i]}" stroke="#c0362c" stroke-width="2" stroke-linecap="round"/>`));
  if (!f.alive) parts.push('<rect width="64" height="64" rx="10" fill="#000" opacity="0.55"/><path d="M20 22 L28 30 M28 22 L20 30 M36 22 L44 30 M44 22 L36 30" stroke="#ddd" stroke-width="2.5"/>');
  return `<svg class="portrait" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="Portrait of ${String(f.name).replace(/[<>&"]/g, '')}">${parts.join('')}</svg>`;
}

// Hand-drawn portraits for dialogue speakers (src/dialogue.js).
const NPC = {
  emperor: `<rect width="64" height="64" rx="10" fill="#3a1d3f"/>
    <path d="M8 64 Q12 50 32 52 Q52 50 56 64Z" fill="#6b2a6e"/><path d="M22 54 L32 62 L42 54" stroke="#d9b45a" stroke-width="2" fill="none"/>
    <path d="M24 46 L24 54 Q32 58 40 54 L40 46Z" fill="#d9a47c"/>
    <path d="M16 30 Q16 12 32 12 Q48 12 48 30 Q48 48 32 51 Q16 48 16 30Z" fill="#d9a47c"/>
    <path d="M17 24 Q20 12 32 11 Q44 12 47 24 Q42 17 32 17 Q22 17 17 24Z" fill="#cfcfcf"/>
    <path d="M14 25 Q18 13 27 10 M50 25 Q46 13 37 10" stroke="#d9b45a" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M15 20 l4 -2 M17 15 l4 -1 M49 20 l-4 -2 M47 15 l-4 -1" stroke="#d9b45a" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M20 27 L28 29 M44 27 L36 29" stroke="#2a1d16" stroke-width="2.2" stroke-linecap="round"/>
    <ellipse cx="25" cy="32" rx="3" ry="2" fill="#fff"/><ellipse cx="39" cy="32" rx="3" ry="2" fill="#fff"/>
    <circle cx="25" cy="32" r="1.5" fill="#2a1d16"/><circle cx="39" cy="32" r="1.5" fill="#2a1d16"/>
    <path d="M32 34 L30 41 L33 41" stroke="rgba(0,0,0,0.3)" stroke-width="1.3" fill="none"/>
    <path d="M26 46 Q32 44 38 46" stroke="#5a2a22" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  steward: `<rect width="64" height="64" rx="10" fill="#2b2a24"/>
    <path d="M8 64 Q12 52 32 54 Q52 52 56 64Z" fill="#5a5446"/>
    <path d="M24 47 L24 55 Q32 59 40 55 L40 47Z" fill="#c9a07c"/>
    <path d="M16 30 Q16 12 32 12 Q48 12 48 30 Q48 49 32 52 Q16 49 16 30Z" fill="#c9a07c"/>
    <path d="M16 31 Q15 22 19 19 M48 31 Q49 22 45 19" stroke="#9a9a92" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="25" cy="32" r="5" fill="none" stroke="#3b3a33" stroke-width="1.5"/><circle cx="39" cy="32" r="5" fill="none" stroke="#3b3a33" stroke-width="1.5"/>
    <path d="M30 32 L34 32" stroke="#3b3a33" stroke-width="1.5"/>
    <circle cx="25" cy="32" r="1.4" fill="#2a1d16"/><circle cx="39" cy="32" r="1.4" fill="#2a1d16"/>
    <path d="M20 25 L29 25 M35 25 L44 25" stroke="#7a7a72" stroke-width="2" stroke-linecap="round"/>
    <path d="M27 45 L37 45" stroke="#5a2a22" stroke-width="2" stroke-linecap="round"/>`,
  prefect: `<rect width="64" height="64" rx="10" fill="#2a1a1a"/>
    <path d="M8 64 Q12 50 32 52 Q52 50 56 64Z" fill="#7a2a22"/><path d="M14 58 L50 58" stroke="#b8b8b0" stroke-width="3"/>
    <path d="M24 46 L24 54 Q32 58 40 54 L40 46Z" fill="#c99a74"/>
    <path d="M17 30 Q17 14 32 14 Q47 14 47 30 Q47 48 32 51 Q17 48 17 30Z" fill="#c99a74"/>
    <path d="M14 30 Q14 10 32 9 Q50 10 50 30 L46 30 Q46 16 32 15 Q18 16 18 30Z" fill="#9a9a92"/>
    <path d="M14 30 L14 42 L19 40 L18 30Z M50 30 L50 42 L45 40 L46 30Z" fill="#9a9a92"/>
    <path d="M22 9 Q32 -2 42 9 Q32 4 22 9Z" fill="#c0362c"/>
    <path d="M21 27 L29 28 M43 27 L35 28" stroke="#2a1d16" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="25" cy="32" r="1.6" fill="#2a1d16"/><circle cx="39" cy="32" r="1.6" fill="#2a1d16"/>
    <path d="M32 34 L30 41 L33 41" stroke="rgba(0,0,0,0.3)" stroke-width="1.3" fill="none"/>
    <path d="M27 45 Q32 47 37 45" stroke="#5a2a22" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  narrator: `<rect width="64" height="64" rx="10" fill="#141a2e"/>
    <circle cx="32" cy="32" r="20" fill="none" stroke="#6fd3ff" stroke-width="2" opacity="0.8"/>
    <circle cx="32" cy="32" r="13" fill="none" stroke="#a98bff" stroke-width="2" opacity="0.8"/>
    <circle cx="32" cy="32" r="6" fill="#e9f6ff" opacity="0.9"/>`,
};

const NPC_LABEL = {
  emperor: 'Portrait of Emperor Silbannacus',
  steward: 'Portrait of your steward',
  prefect: 'Portrait of the Praetorian prefect',
  narrator: 'Portrait of the narrator',
};

export function npcPortrait(id, size = 64) {
  const label = NPC_LABEL[id] ?? `Portrait of ${String(id ?? 'narrator').replace(/[<>&"]/g, '')}`;
  return `<svg class="portrait" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="${label}">${NPC[id] ?? NPC.narrator}</svg>`;
}
