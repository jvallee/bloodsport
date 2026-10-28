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
};
const HAIR = ['#1f1612', '#3a2618', '#6b4426', '#a8742f', '#d8c08a', '#8b2b22', '#cfcfcf'];
const BG = { human: '#3a2a20', elf: '#26332a', orc: '#2f2a1d', android: '#22283a' };

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

// Class gear drawn over the head.
function classGear(f) {
  if (f.cls === 'sagittarius') return '<path d="M10 44 Q8 8 32 6 Q56 8 54 44 L50 44 Q50 14 32 13 Q14 14 14 44Z" fill="#3e4a32" opacity="0.95"/>';
  if (f.cls === 'cestus') return '<rect x="15" y="19" width="34" height="4" rx="2" fill="#a8302a"/>';
  if (f.cls === 'ornitharius') return '<path d="M47 16 Q58 4 54 20 Q52 14 47 16Z" fill="#d9b45a"/>';
  if (f.cls === 'fighter') return '<path d="M16 22 Q16 9 32 8 Q48 9 48 22 L44 22 Q43 14 32 13 Q21 14 20 22Z" fill="#8a7a5a"/><path d="M30 3 L34 3 L33 10 L31 10Z" fill="#a8302a"/>';
  return '';
}

export function portrait(f, size = 48) {
  const pick = picker(hash(`${f.name}|${f.id ?? ''}`));
  const kind = SKIN[f.kind] ? f.kind : 'human';
  const skin = pick(SKIN[kind]);
  const hair = pick(HAIR);
  const style = kind === 'android' ? 'none' : pick(['short', 'long', 'mohawk', 'topknot', 'none', 'short']);
  const face = FACE[f.humor] ?? FACE.phlegmatic;
  const eyeColor = kind === 'elf' ? pick(['#5fae8a', '#7aa6d8', '#c9a640']) : pick(['#3a2618', '#2c3e50', '#4a5a2a']);
  const parts = [`<rect width="64" height="64" rx="10" fill="${BG[kind]}"/>`];
  if (f.titles?.length) parts.push('<path d="M10 40 Q6 20 18 8 M54 40 Q58 20 46 8" stroke="#d9b45a" stroke-width="2.5" fill="none" stroke-dasharray="3 2"/>');
  // Ears go behind the head.
  if (kind === 'elf') parts.push(`<path d="M15 30 L5 18 L17 26Z M49 30 L59 18 L47 26Z" fill="${skin}"/>`);
  else parts.push(`<ellipse cx="15" cy="33" rx="3" ry="5" fill="${skin}"/><ellipse cx="49" cy="33" rx="3" ry="5" fill="${skin}"/>`);
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
    parts.push(`<path d="${face.brows}" stroke="${kind === 'android' ? '#3b4652' : '#2a1d16'}" stroke-width="2" stroke-linecap="round" fill="none"/>`);
    parts.push(`<path d="M32 34 L30 41 L33 41" stroke="rgba(0,0,0,0.25)" stroke-width="1.3" fill="none"/>`);
    parts.push(`<path d="${face.mouth}" stroke="#5a2a22" stroke-width="2" stroke-linecap="round" fill="none"/>`);
    if (kind === 'orc') parts.push('<path d="M25 47 L24 41 L27 46Z M39 47 L40 41 L37 46Z" fill="#f2ead2"/>');
  }
  parts.push(classGear(f));
  // Wounds: a red slash for each current injury (up to three).
  const slashes = ['M20 20 L27 27', 'M41 38 L46 45', 'M18 41 L24 37'];
  (f.injuries ?? []).slice(0, 3).forEach((_, i) => parts.push(`<path d="${slashes[i]}" stroke="#c0362c" stroke-width="2" stroke-linecap="round"/>`));
  if (!f.alive) parts.push('<rect width="64" height="64" rx="10" fill="#000" opacity="0.55"/><path d="M20 22 L28 30 M28 22 L20 30 M36 22 L44 30 M44 22 L36 30" stroke="#ddd" stroke-width="2.5"/>');
  return `<svg class="portrait" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="Portrait of ${String(f.name).replace(/[<>&"]/g, '')}">${parts.join('')}</svg>`;
}
