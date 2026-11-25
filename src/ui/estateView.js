// Interactive 2D Ludus Estate: 3-floor Pompeian Villa Cross-Section + 3/4 Oblique Cutaway Gladiator Room Decorator. Pure.

import {
  BUILDINGS, DEPARTMENTS, PRESTIGE_LEVELS, DECOR, HUMORS, UNREST, MORALE, STRESS, HUMOUR_DRIFT,
  CLASSES, WEAPONS, KINDS,
} from '../data.js';
import {
  VILLA_PLOTS, ROOF_ORACLE_SLOT, ROOM_SLOTS, plotById, roomSlotById, decorZoneOf, isPlotUnlocked,
  resolveEstateSlots, plotCount, plotsFree, levelInfo, rosterCap, decorCap, maxLevel, buildingKnown,
  buildBlocker, upgradeBlocker,
} from '../ludus.js';
import {
  moraleTarget, decorComfortOf, decorCalm, dominantTemperament, effectivePower, effectiveSpeed,
  buyAndAssignDecorBlocker, removeDecorBlocker, hostPrice, hostBlocker,
} from '../run.js';
import { esc, button, BUILDING_ICON } from './components.js';

const DEPT_COLORS = {
  housing: '#d4a259',
  training: '#dd8b4b',
  medical: '#72b66d',
  scouting: '#7fb7d9',
};

const HUMOR_TINT = {
  choleric: '#b5382a',
  sanguine: '#d89d47',
  melancholic: '#6d94b2',
  phlegmatic: '#84b09a',
};

const FLOORS = [
  { id: 'upper', title: 'Upper Colonnade', depth: 'Sunlit arches · Quarters, Lounge & Entertainment' },
  { id: 'ground', title: 'Courtyard & Ground Floor', depth: 'Arena sand · Barracks, Trainer, Medbay & Forge' },
  { id: 'catacomb', title: 'Subterranean Catacombs', depth: 'Excavated vaults · Vulcan, Liaison & Secrets' },
];

// Non-mutating room layout resolution for 3/4 cutaway rendering.
function resolveRoomLayout(f) {
  const layout = {};
  const used = new Set();
  const raw = f?.roomLayout && typeof f.roomLayout === 'object' ? f.roomLayout : {};
  for (const [item, slotId] of Object.entries(raw)) {
    const slot = roomSlotById(slotId);
    if ((f.decor?.[item] ?? 0) > 0 && slot && slot.zone === decorZoneOf(item) && !used.has(slotId)) {
      layout[item] = slotId;
      used.add(slotId);
    }
  }
  for (const [item, count] of Object.entries(f?.decor ?? {})) {
    if ((count ?? 0) <= 0 || layout[item]) continue;
    const zone = decorZoneOf(item);
    const open = ROOM_SLOTS.find((s) => s.zone === zone && !used.has(s.id));
    if (open) {
      layout[item] = open.id;
      used.add(open.id);
    }
  }
  return layout;
}

const isUnrestHot = (run) => (run.unrest ?? 0) >= UNREST.warn || (run.roster ?? []).some((f) => f.morale < MORALE.mutinous);
const clsLabel = (f) => (f.cls === 'fighter' && f.weapon && WEAPONS[f.weapon] ? `Fighter · ${WEAPONS[f.weapon].name}` : (CLASSES[f.cls]?.name ?? 'Gladiator'));

function fighterSilhouetteSvg(x, y, f, pose = 'stand', unrest = false) {
  const cloak = f.cls === 'ornitharius' ? '#587858' : f.cls === 'samnite' ? '#9e382e' : f.cls === 'ashHungry' ? '#8c4b27' : '#586c82';
  const angry = unrest || f.morale < MORALE.mutinous;
  const moodSpark = angry && f.morale < MORALE.restless
    ? `<circle cx="${x + 7}" cy="${y - 24}" r="3.2" fill="#e84b3c"/><text x="${x + 7}" y="${y - 21.5}" text-anchor="middle" font-size="5" fill="#fff" font-weight="700">!</text>`
    : '';
  if (pose === 'bed') {
    return `<g>
      <rect x="${x - 12}" y="${y - 5}" width="26" height="7" rx="2" fill="#5e4937" stroke="#2c2017" stroke-width="0.8"/>
      <rect x="${x - 10}" y="${y - 7}" width="18" height="5" rx="2" fill="#c9baa5"/>
      <circle cx="${x + 10}" cy="${y - 7}" r="3.6" fill="#d9b48f"/>
      ${moodSpark}
    </g>`;
  }
  return `<g class="estate-bob">
    <ellipse cx="${x}" cy="${y + 2}" rx="7" ry="2.2" fill="rgba(0,0,0,0.45)"/>
    <path d="M${x - 5} ${y + 1} L${x - 3} ${y - 11} L${x + 3} ${y - 11} L${x + 5} ${y + 1} Z" fill="${cloak}" stroke="#120c08" stroke-width="0.8"/>
    <circle cx="${x}" cy="${y - 15}" r="3.8" fill="#d9b48f" stroke="#1b120c" stroke-width="0.7"/>
    ${pose === 'train' ? `<line x1="${x + 4}" y1="${y - 10}" x2="${x + 12}" y2="${y - 16}" stroke="#d8b25c" stroke-width="1.6" stroke-linecap="round"/>` : ''}
    ${moodSpark}
  </g>`;
}

function buildingInteriorSvg(run, b, floorId, isSelected, unrest) {
  const def = BUILDINGS[b.type];
  const lv = b.level;
  const deptColor = DEPT_COLORS[def.dept] ?? '#d8b25c';
  const glow = unrest ? '#a63428' : '#d89b44';
  const bgStone = floorId === 'catacomb' ? '#15100e' : floorId === 'upper' ? '#261e18' : '#211914';
  const archStroke = floorId === 'upper' ? 'rgba(240,210,132,0.16)' : floorId === 'catacomb' ? 'rgba(130,110,95,0.12)' : 'rgba(235,212,175,0.09)';
  const sid = esc(b.id);

  let art = `
    <rect x="0" y="0" width="140" height="76" fill="${bgStone}"/>
    <rect x="0" y="62" width="140" height="14" fill="#17110d"/>
    <line x1="0" y1="62" x2="140" y2="62" stroke="#3c2f25" stroke-width="1"/>
    <path d="M8 62 L8 14 Q70 2 132 14 L132 62" fill="none" stroke="${archStroke}" stroke-width="1.5"/>
  `;

  if (b.type === 'quarters') {
    const qList = (run.buildings ?? []).filter((x) => x.type === 'quarters');
    const qIdx = Math.max(0, qList.indexOf(b));
    const resting = (run.roster ?? []).filter((f) => f.job === 'rest').slice(qIdx * 2, qIdx * 2 + 2);
    art += `
      <radialGradient id="qglow-${sid}" cx="50%" cy="28%" r="55%"><stop offset="0%" stop-color="${glow}" stop-opacity="0.28"/><stop offset="100%" stop-color="${glow}" stop-opacity="0"/></radialGradient>
      <rect x="0" y="0" width="140" height="76" fill="url(#qglow-${sid})"/>
      <rect x="14" y="45" width="32" height="17" rx="2" fill="#4f3928" stroke="#241911"/>
      <rect x="16" y="43" width="22" height="6" rx="2" fill="#8f362a"/>
      <rect x="94" y="45" width="32" height="17" rx="2" fill="#4f3928" stroke="#241911"/>
      <rect x="102" y="43" width="22" height="6" rx="2" fill="#b48a46"/>
      <path d="M62 12 L78 12 L78 36 L70 42 L62 36 Z" fill="#8c2e24" stroke="#d8b25c" stroke-width="0.9"/>
      ${lv >= 2 ? '<circle cx="70" cy="24" r="4" fill="none" stroke="#f0d284" stroke-width="1"/>' : ''}
      ${lv >= 3 ? '<rect x="4" y="8" width="5" height="54" fill="#3a2d22"/><rect x="131" y="8" width="5" height="54" fill="#3a2d22"/>' : ''}
      ${resting.map((f, i) => fighterSilhouetteSvg(i === 0 ? 52 : 88, 60, f, 'stand', unrest)).join('')}
    `;
  } else if (b.type === 'trainer') {
    const tList = (run.buildings ?? []).filter((x) => x.type === 'trainer');
    const tIdx = Math.max(0, tList.indexOf(b));
    const training = (run.roster ?? []).filter((f) => f.job === 'trainPower' || f.job === 'trainSpeed').slice(tIdx, tIdx + 1);
    art += `
      <rect x="0" y="56" width="140" height="20" fill="#4a3824"/>
      <rect x="96" y="28" width="8" height="34" fill="#6b4e33" stroke="#2a1e13"/>
      <rect x="88" y="34" width="24" height="5" fill="#7d5d3f"/>
      <circle cx="100" cy="25" r="5" fill="#8b6948"/>
      <rect x="14" y="26" width="26" height="36" fill="#2a2018" stroke="#463628"/>
      <line x1="20" y1="30" x2="20" y2="58" stroke="#b9c2c9" stroke-width="1.6"/>
      <line x1="27" y1="30" x2="27" y2="58" stroke="#d8b25c" stroke-width="1.6"/>
      <line x1="34" y1="30" x2="34" y2="58" stroke="#b9c2c9" stroke-width="1.6"/>
      ${lv >= 2 ? '<circle cx="62" cy="18" r="3" fill="#e59a3e" class="estate-flame"/>' : ''}
      ${training.map((f) => fighterSilhouetteSvg(74, 60, f, 'train', unrest)).join('')}
    `;
  } else if (b.type === 'medbay') {
    const mList = (run.buildings ?? []).filter((x) => x.type === 'medbay');
    const mIdx = Math.max(0, mList.indexOf(b));
    const healing = (run.roster ?? []).filter((f) => f.job === 'medbay').slice(mIdx, mIdx + 1);
    const stranger = mIdx === 0 && Boolean(run.plot?.hidden);
    art += `
      <rect x="16" y="16" width="24" height="24" rx="2" fill="#27211b" stroke="#475c43"/>
      <path d="M28 21 V35 M21 28 H35" stroke="#72b66d" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="52" y="18" width="28" height="16" fill="#2b211a" stroke="#463628"/>
      <circle cx="59" cy="26" r="2.5" fill="#72b66d"/><circle cx="67" cy="26" r="2.5" fill="#d8b25c"/><circle cx="74" cy="26" r="2.5" fill="#b85838"/>
      ${healing.map((f) => fighterSilhouetteSvg(64, 59, f, 'bed', unrest)).join('')}
      ${stranger ? '<g opacity="0.92"><rect x="98" y="54" width="28" height="7" rx="2" fill="#46382c"/><path d="M100 54 Q112 41 124 54 Z" fill="#323b44" stroke="#7fb7d9" stroke-width="0.8"/><circle cx="118" cy="48" r="3.4" fill="#242c33" stroke="#7fb7d9" stroke-width="0.7"/></g>' : '<rect x="98" y="52" width="28" height="9" rx="2" fill="#49392b" stroke="#241b13"/>'}
    `;
  } else if (b.type === 'armourer') {
    art += `
      <radialGradient id="aglow-${sid}" cx="22%" cy="68%" r="48%"><stop offset="0%" stop-color="#e8792f" stop-opacity="0.45"/><stop offset="100%" stop-color="#e8792f" stop-opacity="0"/></radialGradient>
      <rect x="0" y="0" width="140" height="76" fill="url(#aglow-${sid})"/>
      <path d="M12 62 L12 36 Q26 24 40 36 L40 62 Z" fill="#2c1d17" stroke="#593c2d"/>
      <path d="M19 60 Q26 42 33 60 Z" fill="#eb7d2d" class="estate-flame"/>
      <path d="M56 62 L60 50 L82 50 L86 62 Z M52 50 L90 50 L85 44 L57 44 Z" fill="#6d7278" stroke="#242629"/>
      <ellipse cx="114" cy="36" rx="11" ry="15" fill="#875d34" stroke="#d8b25c" stroke-width="1.2"/>
      <circle cx="114" cy="36" r="3.2" fill="#d8b25c"/>
    `;
  } else if (b.type === 'entertainment') {
    art += `
      <radialGradient id="eglow-${sid}" cx="50%" cy="35%" r="55%"><stop offset="0%" stop-color="#e3aa4a" stop-opacity="0.3"/><stop offset="100%" stop-color="#e3aa4a" stop-opacity="0"/></radialGradient>
      <rect x="0" y="0" width="140" height="76" fill="url(#eglow-${sid})"/>
      <path d="M12 10 Q42 26 70 10 Q98 26 128 10" fill="none" stroke="#b84632" stroke-width="3"/>
      <rect x="34" y="48" width="72" height="14" rx="2" fill="#523927" stroke="#261a11"/>
      <path d="M62 24 C56 32 58 43 70 43 C82 43 84 32 78 24" fill="none" stroke="#e4c16a" stroke-width="2"/>
      <line x1="66" y1="26" x2="66" y2="42" stroke="#f2dc9b" stroke-width="0.8"/>
      <line x1="70" y1="26" x2="70" y2="42" stroke="#f2dc9b" stroke-width="0.8"/>
      <line x1="74" y1="26" x2="74" y2="42" stroke="#f2dc9b" stroke-width="0.8"/>
    `;
  } else if (b.type === 'vulcan') {
    art += `
      <radialGradient id="vglow-${sid}" cx="50%" cy="62%" r="54%"><stop offset="0%" stop-color="#d45529" stop-opacity="${lv >= 2 ? 0.56 : 0.4}"/><stop offset="100%" stop-color="#d45529" stop-opacity="0"/></radialGradient>
      <rect x="0" y="0" width="140" height="76" fill="url(#vglow-${sid})"/>
      <rect x="40" y="46" width="60" height="16" fill="#2c2420" stroke="#5b4639"/>
      <path d="M52 46 Q70 20 88 46 Z" fill="#cf4a24" opacity="0.84" class="estate-flame"/>
      <path d="M60 46 Q70 29 80 46 Z" fill="#f2b857" class="estate-flame"/>
      <circle cx="24" cy="24" r="6" fill="none" stroke="#856956" stroke-width="1.2"/>
      <circle cx="116" cy="24" r="6" fill="none" stroke="#856956" stroke-width="1.2"/>
    `;
  } else if (b.type === 'lounge') {
    art += `
      <rect x="16" y="44" width="38" height="18" rx="3" fill="#6b2820" stroke="#d8b25c" stroke-width="0.9"/>
      <rect x="86" y="44" width="38" height="18" rx="3" fill="#6b2820" stroke="#d8b25c" stroke-width="0.9"/>
      <rect x="60" y="48" width="20" height="14" fill="#463325"/>
      <path d="M66 48 L64 38 L76 38 L74 48 Z" fill="#d8b25c"/>
      <rect x="26" y="14" width="88" height="20" fill="#2a211a" stroke="#5d4b37"/>
      <text x="70" y="27" text-anchor="middle" font-size="8" font-family="Georgia,serif" fill="#d8b25c" letter-spacing="2">S·P·Q·R</text>
    `;
  } else if (b.type === 'oracle') {
    art += `
      <circle cx="70" cy="36" r="20" fill="none" stroke="#7fb7d9" stroke-width="1.2" stroke-dasharray="3 2"/>
      <path d="M44 36 Q70 18 96 36 Q70 54 44 36 Z" fill="#1e2a33" stroke="#d8b25c" stroke-width="1.3"/>
      <circle cx="70" cy="36" r="6" fill="#7fb7d9"/>
      <circle cx="70" cy="36" r="2.5" fill="#0d1318"/>
    `;
  } else if (b.type === 'gallery') {
    art += `
      <path d="M22 62 L22 24 Q46 10 70 24 Q94 10 118 24 L118 62" fill="#1d1815" stroke="#5d4d3e" stroke-width="1.5"/>
      <path d="M48 36 Q70 26 92 36" fill="none" stroke="#7fb7d9" stroke-width="1.2" stroke-dasharray="2 3"/>
      <circle cx="36" cy="46" r="3" fill="#d8b25c" class="estate-flame"/>
      <circle cx="104" cy="46" r="3" fill="#d8b25c" class="estate-flame"/>
      <path d="M64 60 L66 44 L74 44 L76 60 Z" fill="#2e3b47"/>
      <circle cx="70" cy="40" r="3.5" fill="#7fb7d9"/>
    `;
  } else if (b.type === 'liaison') {
    art += `
      <rect x="22" y="16" width="96" height="46" fill="#120e0c" stroke="#473c33"/>
      ${[36, 52, 68, 84, 100].map((x) => `<line x1="${x}" y1="16" x2="${x}" y2="62" stroke="#6d7175" stroke-width="2"/>`).join('')}
      <line x1="22" y1="36" x2="118" y2="36" stroke="#52565a" stroke-width="1.6"/>
      <circle cx="70" cy="36" r="4" fill="#d8b25c"/>
    `;
  } else if (b.type === 'temple') {
    art += `
      <polygon points="24,24 70,8 116,24" fill="#3a2e23" stroke="#d8b25c" stroke-width="1"/>
      ${[34, 52, 88, 106].map((x) => `<rect x="${x - 3}" y="24" width="6" height="38" fill="#59493a"/>`).join('')}
      <circle cx="70" cy="42" r="10" fill="none" stroke="#e5c16a" stroke-width="1.8"/>
      <path d="M70 32 V52 M60 42 H80" stroke="#e5c16a" stroke-width="1.2"/>
    `;
  } else if (b.type === 'exhibition') {
    art += `
      <ellipse cx="70" cy="54" rx="52" ry="12" fill="#6e5332" stroke="#9b794a" stroke-width="1.4"/>
      <line x1="56" y1="22" x2="84" y2="48" stroke="#d8b25c" stroke-width="2.4" stroke-linecap="round"/>
      <line x1="84" y1="22" x2="56" y2="48" stroke="#c2cbd1" stroke-width="2.4" stroke-linecap="round"/>
    `;
  }

  if (isSelected) art += '<rect x="1" y="1" width="138" height="74" fill="none" stroke="#ecd082" stroke-width="1.6" opacity="0.72"/>';
  return `<svg class="bay-art" viewBox="0 0 140 76" aria-hidden="true">${art}<rect x="0" y="0" width="140" height="3" fill="${deptColor}"/></svg>`;
}

// 3/4 Oblique Cutaway SVG art for all 13 decor items (clusters 1..3 visual copies + badge).
function decorPropSvg(key, count) {
  const n = Math.min(3, Math.max(1, count));
  const badge = count > 1
    ? `<g transform="translate(22, -20)"><circle r="9" fill="#231a13" stroke="#d9b45a" stroke-width="1.4"/><text y="3.5" text-anchor="middle" font-size="9.5" font-weight="700" fill="#ecd082">×${count}</text></g>`
    : '';

  let g = '';
  if (key === 'warBanner') {
    g = Array.from({ length: n }, (_, i) => {
      const dx = (i - (n - 1) / 2) * 14;
      return `<g transform="translate(${dx},0)"><line x1="-11" y1="-22" x2="11" y2="-22" stroke="#d9b45a" stroke-width="2.2"/><path d="M-9 -21 L9 -21 L9 12 L0 20 L-9 12 Z" fill="#a32d24" stroke="#e4c16a" stroke-width="1.2"/><path d="M0 -13 L3 -4 L-3 -4 Z" fill="#ecd082"/></g>`;
    }).join('');
  } else if (key === 'trophy') {
    g = `<rect x="-24" y="-12" width="48" height="24" rx="2" fill="#463222" stroke="#7d5d3f"/>`
      + Array.from({ length: n }, (_, i) => {
        const dx = (i - (n - 1) / 2) * 15;
        return `<g transform="translate(${dx},0)"><circle cy="-2" r="5" fill="#d9b45a"/><rect x="-2" y="3" width="4" height="6" fill="#9c7a36"/></g>`;
      }).join('');
  } else if (key === 'shrine') {
    g = '<polygon points="-20,-12 0,-25 20,-12" fill="#594738" stroke="#d9b45a" stroke-width="1.1"/><rect x="-17" y="-12" width="34" height="26" fill="#2c221b" stroke="#6c5643"/><circle cy="0" r="6" fill="none" stroke="#d9b45a" stroke-width="1.4"/><circle cy="8" r="3" fill="#eb8a34" class="estate-flame"/>';
  } else if (key === 'skullRack') {
    g = '<rect x="-23" y="-14" width="46" height="26" rx="2" fill="#2b1916" stroke="#853027"/>'
      + Array.from({ length: n }, (_, i) => {
        const dx = (i - (n - 1) / 2) * 14;
        return `<g transform="translate(${dx},0)"><circle cy="-3" r="5.5" fill="#e6dcc9"/><rect x="-3" y="2" width="6" height="4" rx="1" fill="#d3c5ae"/><circle cx="-2" cy="-3" r="1.2" fill="#261311"/><circle cx="2" cy="-3" r="1.2" fill="#261311"/></g>`;
      }).join('');
  } else if (key === 'bird') {
    g = '<ellipse cx="0" cy="14" rx="18" ry="6" fill="rgba(0,0,0,0.4)"/><line x1="0" y1="14" x2="0" y2="-10" stroke="#7c5d3c" stroke-width="3"/><line x1="-22" y1="-9" x2="22" y2="-9" stroke="#99744d" stroke-width="3" stroke-linecap="round"/>'
      + Array.from({ length: n }, (_, i) => {
        const dx = (i - (n - 1) / 2) * 15;
        return `<g transform="translate(${dx},-15)"><ellipse rx="5.5" ry="7.5" fill="#7c6248" stroke="#1b140e"/><circle cx="2" cy="-7" r="3.5" fill="#9c7e5f"/><polygon points="5,-7 9,-5.5 5,-4.5" fill="#e5b953"/></g>`;
      }).join('');
  } else if (key === 'fireBrazier') {
    g = Array.from({ length: n }, (_, i) => {
      const dx = (i - (n - 1) / 2) * 16;
      return `<g transform="translate(${dx},0)"><ellipse cy="14" rx="11" ry="4" fill="rgba(0,0,0,0.42)"/><path d="M-8 12 L-5 2 L5 2 L8 12 Z" fill="#473c36"/><path d="M-11 2 L11 2 L7 -4 L-7 -4 Z" fill="#635348" stroke="#241c17"/><path d="M-6 -4 Q0 -21 6 -4 Z" fill="#e66a22" class="estate-flame"/><path d="M-3 -4 Q0 -14 3 -4 Z" fill="#f7ce65" class="estate-flame"/></g>`;
    }).join('');
  } else if (key === 'bathhouse') {
    g = '<ellipse cx="0" cy="14" rx="26" ry="9" fill="rgba(0,0,0,0.4)"/><rect x="-25" y="-4" width="50" height="18" rx="4" fill="#6b5e50" stroke="#2f2720"/><ellipse cx="0" cy="-4" rx="24" ry="8" fill="#3b6e82" stroke="#a8947a" stroke-width="2"/><path d="M-12 -12 Q-9 -19 -12 -24 M0 -14 Q3 -21 0 -27 M11 -12 Q14 -19 11 -24" stroke="rgba(220,242,250,0.5)" stroke-width="1.5" fill="none" stroke-linecap="round"/>';
  } else if (key === 'lionCage') {
    g = `<rect x="-23" y="-18" width="46" height="32" fill="#1b140f" stroke="#7c7670" stroke-width="1.8"/><circle cx="0" cy="2" r="9" fill="#9c6222"/><circle cx="0" cy="2" r="5.5" fill="#d9a148"/>${[-14, -5, 5, 14].map((x) => `<line x1="${x}" y1="-18" x2="${x}" y2="14" stroke="#8b857e" stroke-width="1.7"/>`).join('')}`;
  } else if (key === 'rockGarden') {
    g = '<ellipse cx="0" cy="8" rx="26" ry="12" fill="#b8ad97" stroke="#5d4c39" stroke-width="2"/><path d="M-18 6 Q0 2 18 6 M-14 11 Q0 8 14 11" stroke="#8f8572" stroke-width="1.1" fill="none"/><ellipse cx="-7" cy="2" rx="7" ry="6" fill="#67645e"/><ellipse cx="8" cy="4" rx="5" ry="4" fill="#7c7972"/>';
  } else if (key === 'spikyBed') {
    g = `<ellipse cx="0" cy="14" rx="26" ry="7" fill="rgba(0,0,0,0.42)"/><rect x="-24" y="0" width="48" height="12" rx="2" fill="#3a322d" stroke="#1f1a17"/>${[-18, -10, -2, 6, 14].map((x) => `<polygon points="${x},0 ${x + 3},-9 ${x + 6},0" fill="#a9b5bf"/>`).join('')}`;
  } else if (key === 'wineAmphora') {
    g = Array.from({ length: n }, (_, i) => {
      const dx = (i - (n - 1) / 2) * 14;
      return `<g transform="translate(${dx},0)"><ellipse cy="13" rx="8" ry="3.5" fill="rgba(0,0,0,0.4)"/><ellipse cy="1" rx="8.5" ry="11" fill="#b85b38" stroke="#5e2a18"/><rect x="-3.5" y="-14" width="7" height="5" fill="#c96b45"/><path d="M-8 -4 C-13 -4 -13 -11 -4 -11 M8 -4 C13 -4 13 -11 4 -11" fill="none" stroke="#964326" stroke-width="1.6"/></g>`;
    }).join('');
  } else if (key === 'terrarium') {
    g = '<rect x="-22" y="-14" width="44" height="26" rx="3" fill="rgba(42,66,40,0.75)" stroke="#88ab7e" stroke-width="1.5"/><rect x="-20" y="5" width="40" height="6" fill="#4b3e2b"/><path d="M-12 4 Q-4 -6 4 2 T13 -2" fill="none" stroke="#96dc6c" stroke-width="2.2" stroke-linecap="round"/>';
  } else if (key === 'whetstone') {
    g = '<ellipse cx="0" cy="14" rx="20" ry="6" fill="rgba(0,0,0,0.4)"/><path d="M-16 12 L-8 -4 L8 -4 L16 12" fill="none" stroke="#6b4e34" stroke-width="3"/><circle cx="0" cy="-2" r="11" fill="#8f979e" stroke="#454b50" stroke-width="1.5"/><circle cx="0" cy="-2" r="3" fill="#423222"/>';
  }
  return `${g}${badge}`;
}

function renderVillaBay(run, plot, bySlot, selectedSlot, unrest) {
  const b = bySlot.get(plot.id) ?? null;
  const unlocked = isPlotUnlocked(run, plot);
  const selected = selectedSlot === plot.id;

  if (b) {
    const def = BUILDINGS[b.type];
    const pips = def.cost.map((_, i) => `<i class="${i < b.level ? 'on' : ''}"></i>`).join('');
    let meta = `Lv ${b.level}/${def.cost.length}`;
    if (b.type === 'quarters') meta = `${(run.roster ?? []).filter((f) => f.job === 'rest').length} resting · ${(run.roster ?? []).length} housed`;
    else if (b.type === 'trainer') meta = `${(run.roster ?? []).filter((f) => f.job === 'trainPower' || f.job === 'trainSpeed').length} training`;
    else if (b.type === 'medbay') meta = `${(run.roster ?? []).filter((f) => f.job === 'medbay').length}${run.plot?.hidden ? '+1' : ''} beds`;
    return `<button class="est-bay built${selected ? ' selected' : ''}" data-action="estate-select-slot" data-slot="${plot.id}">
      ${buildingInteriorSvg(run, b, plot.floor, selected, unrest)}
      <div class="est-bay-foot">
        <div class="est-bay-head"><span class="est-bay-name">${esc(def.name)}</span><span class="est-pips">${pips}</span></div>
        <div class="est-bay-meta">${esc(meta)}</div>
      </div>
    </button>`;
  }

  // Narrative reveal: Whispering Gallery sits behind the cracked masonry wall in the Catacombs when known and unbuilt.
  const showGalleryWall = plot.sealedGallery && unlocked && buildingKnown(run, 'gallery') && !maxLevel(run, 'gallery');
  if (showGalleryWall) {
    return `<button class="est-bay sealed-wall${selected ? ' selected' : ''}" data-action="estate-select-slot" data-slot="${plot.id}">
      <svg width="42" height="36" viewBox="0 0 42 36" aria-hidden="true">
        <rect x="2" y="4" width="38" height="28" rx="2" fill="#32231b" stroke="#8f5136"/>
        <path d="M2 14 H40 M2 23 H40 M15 4 V14 M28 14 V23 M18 23 V32" stroke="#18100c" stroke-width="1.5"/>
        <path d="M21 5 L19 15 L24 22 L20 31" fill="none" stroke="#e3a654" stroke-width="1.6"/>
      </svg>
      <div class="est-empty-label" style="color:var(--gold-bright)">Cracked Masonry</div>
      <div class="est-lock-label">Whispering Gallery</div>
    </button>`;
  }

  if (unlocked) {
    const canBuildHere = plotsFree(run) > 0;
    return `<button class="est-bay empty${selected ? ' selected' : ''}${canBuildHere ? '' : ' capped'}" data-action="estate-select-slot" data-slot="${plot.id}">
      <span class="est-plus">${canBuildHere ? '+' : '·'}</span>
      <div class="est-empty-label">${esc(plot.hint)}</div>
      <div class="est-lock-label">${canBuildHere ? 'Build here' : 'Plot limit reached'}</div>
    </button>`;
  }

  const req = PRESTIGE_LEVELS[plot.unlockLv - 1];
  return `<button class="est-bay locked${selected ? ' selected' : ''}" data-action="estate-select-slot" data-slot="${plot.id}">
    <div class="est-lock-label">🔒 Lv ${plot.unlockLv}<br>${req.at} Prestige</div>
  </button>`;
}

function renderEstateInspector(run, bySlot, selectedSlot) {
  const b = bySlot.get(selectedSlot) ?? null;
  const plot = plotById(selectedSlot);

  if (b) {
    const def = BUILDINGS[b.type];
    const nextLv = b.level < def.cost.length ? b.level + 1 : null;
    const upWhy = nextLv ? upgradeBlocker(run, b.id) : null;
    const deptName = DEPARTMENTS[def.dept];
    const deptColor = DEPT_COLORS[def.dept] ?? '#d8b25c';

    let extras = '';
    if (b.type === 'quarters') {
      const roster = run.roster ?? [];
      extras = `<div class="est-insp-sec">
        <div class="est-kicker">Wing Occupants (${roster.length}/${rosterCap(run)} Housed)</div>
        ${roster.length
          ? `<div class="est-list">${roster.map((f) => {
            const cnt = Object.values(f.decor ?? {}).reduce((s, n) => s + n, 0);
            const where = f.job === 'rest' ? 'Resting in cell' : f.job === 'medbay' ? 'In Medbay' : 'In Trainer Room';
            return `<div class="est-row">
              <div class="est-row-main">
                <div class="est-row-title">${esc(f.name)} <span class="est-tag">${esc(clsLabel(f))}</span></div>
                <div class="est-row-sub">${where} · ${cnt} decor${f.humor ? ` · ${HUMORS[f.humor].name}` : ''}</div>
              </div>
              <button class="btn small primary" data-action="estate-open-room" data-id="${esc(f.id)}">Decorate</button>
            </div>`;
          }).join('')}</div>`
          : '<p class="sub">Recruit gladiators in the Market to house and decorate their cells here.</p>'}
      </div>`;
    } else if (b.type === 'trainer' || b.type === 'medbay') {
      const list = (run.roster ?? []).filter((f) => (b.type === 'trainer' ? (f.job === 'trainPower' || f.job === 'trainSpeed') : f.job === 'medbay'));
      extras = `<div class="est-insp-sec">
        <div class="est-kicker">Current Occupants</div>
        <div class="est-list">
          ${list.length ? list.map((f) => `<div class="est-row">
            <div class="est-row-main">
              <div class="est-row-title">${esc(f.name)} <span class="est-tag">${esc(clsLabel(f))}</span></div>
              <div class="est-row-sub">Stress ${f.stress} · Morale ${f.morale}</div>
            </div>
            <button class="btn small" data-action="estate-open-room" data-id="${esc(f.id)}">Cell →</button>
          </div>`).join('') : '<p class="sub">No fighters assigned here this week.</p>'}
          ${b.type === 'medbay' && run.plot?.hidden ? '<div class="est-row"><div class="est-row-main"><div class="est-row-title">Shrouded Stranger <span class="est-tag gold">Hidden</span></div><div class="est-row-sub">Occupies 1 Medbay cot until the rising moves.</div></div></div>' : ''}
        </div>
      </div>`;
    } else if (b.type === 'lounge') {
      const why = hostBlocker(run);
      extras = `<div class="est-insp-sec">
        <div class="est-kicker">Senate Table · Influence ${run.influence ?? 0}</div>
        ${button(`🍷 Host the Senate (${hostPrice(run)} Gold)`, 'host', {}, why, 'btn small primary btn-block')}
        ${why ? `<div class="why-not">${esc(why)}</div>` : ''}
      </div>`;
    }

    const slotTag = selectedSlot === ROOF_ORACLE_SLOT ? 'Roof Observatory' : (plot?.hint ?? selectedSlot);
    return `
      <div class="est-insp-sec">
        <div class="est-kicker" style="color:${deptColor}">${esc(deptName)} · ${esc(slotTag)}</div>
        <h3 class="est-insp-title">${BUILDING_ICON[def.icon] ?? ''} ${esc(def.name)} <span class="est-tag gold">Lv ${b.level}/${def.cost.length}</span></h3>
        <p class="sub">${esc(def.effect(def.per[b.level - 1]))}${def.extra ? `. ${esc(def.extra(b.level))}.` : '.'}</p>
        ${nextLv
          ? `<div class="est-row-sub">Next (Lv ${nextLv}): ${esc(def.effect(def.per[b.level]))}${def.extra ? `; ${esc(def.extra(nextLv))}` : ''}</div>
             <div class="est-insp-act">${button(`Upgrade · ${def.cost[b.level]} Gold`, 'upgrade', { id: b.id }, upWhy, 'btn small primary btn-block')}</div>
             ${upWhy ? `<div class="why-not">${esc(upWhy)}</div>` : ''}`
          : '<div class="est-tag good">Fully upgraded</div>'}
      </div>
      ${extras}
    `;
  }

  if (!plot) {
    return '<div class="est-insp-sec"><div class="est-kicker">The Ludus</div><p class="sub">Select any room or excavated bay in the cross-section to inspect, upgrade, or build.</p></div>';
  }

  if (!isPlotUnlocked(run, plot)) {
    const req = PRESTIGE_LEVELS[plot.unlockLv - 1];
    return `<div class="est-insp-sec">
      <div class="est-kicker">Unexcavated Wing</div>
      <h3 class="est-insp-title">${esc(plot.hint)}</h3>
      <p class="sub">Locked behind stone until House Prestige level <b>${plot.unlockLv}</b> (${req.at} Prestige · ${req.plots} plots).</p>
    </div>`;
  }

  const free = plotsFree(run);
  const options = Object.entries(BUILDINGS).filter(([type]) => buildingKnown(run, type)).map(([type, def]) => {
    const reason = buildBlocker(run, type, plot.id);
    return `<button class="build-opt" data-action="build" data-type="${type}" data-slot="${plot.id}" ${reason ? `disabled title="${esc(reason)}"` : ''}>
      <span>${BUILDING_ICON[def.icon]} <b>${esc(def.name)}</b> · ${def.cost[0]} Gold${def.secret ? ' · ✦ Secret' : ''}</span>
      <small>${esc(def.effect(def.per[0]))}${reason ? ` · ${esc(reason)}` : ''}</small>
    </button>`;
  }).join('');

  const lastWarn = free === 1 ? '<div class="why-not">⚠ This is your last free plot: buildings can\'t be torn down, so choose carefully.</div>' : '';
  const wallIntro = plot.sealedGallery && buildingKnown(run, 'gallery') && !maxLevel(run, 'gallery')
    ? '<p class="sub">A hollow echo rings behind this catacomb wall: the secret <b>Whispering Gallery</b> can be built here.</p>'
    : `<p class="sub">Choose a building for <b>${esc(plot.hint)}</b> (${free} free plot${free === 1 ? '' : 's'} remaining).</p>`;

  return `<div class="est-insp-sec">
    <div class="est-kicker">Excavated Plot · ${esc(plot.floor)}</div>
    <h3 class="est-insp-title">+ ${esc(plot.hint)}</h3>
    ${wallIntro}${lastWarn}
    <div class="build-list">${options}</div>
  </div>`;
}

function renderRoomSvg(f, layout, selectedRoomSlot, movingItem) {
  const dom = dominantTemperament(f);
  const activeHumor = (dom && !dom.tied ? dom.humor : null) ?? f.humor ?? 'melancholic';
  const tint = HUMOR_TINT[activeHumor] ?? '#6d94b2';
  const moveZone = movingItem ? decorZoneOf(movingItem) : null;

  const bySlot = {};
  for (const [itemKey, slotId] of Object.entries(layout)) {
    if ((f.decor?.[itemKey] ?? 0) > 0) bySlot[slotId] = itemKey;
  }

  const slotsSvg = ROOM_SLOTS.map((slot) => {
    const itemKey = bySlot[slot.id] ?? null;
    const count = itemKey ? (f.decor?.[itemKey] ?? 0) : 0;
    const isSel = selectedRoomSlot === slot.id;
    const isMoveTarget = Boolean(moveZone && moveZone === slot.zone && itemKey !== movingItem);

    // If we are in Move Mode and this anchor matches the item's zone, clicking commits the real `move-decor` game action!
    const actAttrs = isMoveTarget
      ? `data-action="move-decor" data-id="${esc(f.id)}" data-item="${esc(movingItem)}" data-slot="${slot.id}"`
      : `data-action="estate-room-slot" data-slot="${slot.id}"`;

    const pad = slot.zone === 'wall'
      ? `<rect class="est-slot-pad" x="-30" y="-22" width="60" height="44" rx="5" fill="${itemKey ? 'rgba(217,180,90,0.06)' : 'rgba(255,236,206,0.03)'}" stroke="${itemKey ? 'rgba(217,180,90,0.28)' : 'rgba(255,236,206,0.14)'}" stroke-dasharray="${itemKey ? 'none' : '3 3'}"/>`
      : `<ellipse class="est-slot-pad" cx="0" cy="8" rx="34" ry="16" fill="${itemKey ? 'rgba(217,180,90,0.07)' : 'rgba(255,236,206,0.03)'}" stroke="${itemKey ? 'rgba(217,180,90,0.28)' : 'rgba(255,236,206,0.14)'}" stroke-dasharray="${itemKey ? 'none' : '3 3'}"/>`;

    const content = itemKey
      ? decorPropSvg(itemKey, count)
      : `<text y="${slot.zone === 'wall' ? 4 : 11}" text-anchor="middle" font-size="10" fill="#8b7b6a">${slot.zone === 'wall' ? '+ Wall' : '+ Floor'}</text>`;

    const label = itemKey
      ? `<text y="32" text-anchor="middle" font-size="10" fill="#dfd0b8" font-weight="500">${esc(DECOR[itemKey].name)}</text>`
      : '';

    return `<g class="est-slot${isSel ? ' selected' : ''}${isMoveTarget ? ' valid-target' : ''}" ${actAttrs} transform="translate(${slot.x},${slot.y})" role="button" tabindex="0" aria-label="${esc(itemKey ? `${DECOR[itemKey].name} ×${count} at ${slot.label}` : `Empty ${slot.label}`)}">
      ${pad}${content}${label}
    </g>`;
  }).join('');

  return `<svg class="est-room-svg" viewBox="0 0 720 400" role="img" aria-label="${esc(f.name)}'s quarters room">
    <defs>
      <radialGradient id="estTorch-${esc(f.id)}" cx="50%" cy="32%" r="65%">
        <stop offset="0%" stop-color="${tint}" stop-opacity="0.34"/>
        <stop offset="55%" stop-color="#c98e42" stop-opacity="0.1"/>
        <stop offset="100%" stop-color="#0b0806" stop-opacity="0"/>
      </radialGradient>
      <pattern id="estAshlar" width="60" height="28" patternUnits="userSpaceOnUse">
        <rect width="60" height="28" fill="none" stroke="rgba(255,236,206,0.055)" stroke-width="1"/>
        <line x1="30" y1="14" x2="30" y2="28" stroke="rgba(255,236,206,0.05)" stroke-width="1"/>
        <line x1="0" y1="14" x2="60" y2="14" stroke="rgba(255,236,206,0.055)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="720" height="400" fill="#0f0b08"/>
    <polygon points="48,26 116,64 116,174 48,376" fill="#211913" stroke="#3c2f24" stroke-width="1.5"/>
    <polygon points="672,26 604,64 604,174 672,376" fill="#1e1712" stroke="#3c2f24" stroke-width="1.5"/>
    <rect x="116" y="64" width="488" height="110" fill="#2a2018" stroke="#47382b" stroke-width="1.5"/>
    <rect x="116" y="64" width="488" height="110" fill="url(#estAshlar)"/>
    <rect x="116" y="146" width="488" height="28" fill="#46221c" opacity="0.58"/>
    <line x1="116" y1="146" x2="604" y2="146" stroke="#b88d46" stroke-width="1.5" opacity="0.55"/>
    <polygon points="116,174 604,174 672,376 48,376" fill="#241c15" stroke="#4b3a2c" stroke-width="1.5"/>
    <polygon points="154,192 566,192 618,358 102,358" fill="none" stroke="rgba(217,180,90,0.18)" stroke-width="1.5"/>
    <line x1="278" y1="174" x2="236" y2="376" stroke="rgba(255,236,206,0.05)" stroke-width="1"/>
    <line x1="442" y1="174" x2="484" y2="376" stroke="rgba(255,236,206,0.05)" stroke-width="1"/>
    <line x1="94" y1="240" x2="626" y2="240" stroke="rgba(255,236,206,0.05)" stroke-width="1"/>
    <line x1="72" y1="308" x2="648" y2="308" stroke="rgba(255,236,206,0.05)" stroke-width="1"/>
    <polygon points="48,26 672,26 604,64 116,64" fill="#17120e" stroke="#362a20" stroke-width="1"/>
    <rect width="720" height="400" fill="url(#estTorch-${esc(f.id)})" pointer-events="none"/>
    <rect x="334" y="72" width="52" height="22" rx="2" fill="#181f29" stroke="#5c4b3b" stroke-width="1.4"/>
    <line x1="347" y1="72" x2="347" y2="94" stroke="#4f4944" stroke-width="1.8"/>
    <line x1="360" y1="72" x2="360" y2="94" stroke="#4f4944" stroke-width="1.8"/>
    <line x1="373" y1="72" x2="373" y2="94" stroke="#4f4944" stroke-width="1.8"/>
    ${slotsSvg}
    <g transform="translate(66, 332)" opacity="0.92">${fighterSilhouetteSvg(0, 0, f, 'stand', false)}<text x="0" y="14" text-anchor="middle" font-size="9.5" fill="#d9b45a">${esc(f.name)}</text></g>
  </svg>`;
}

function renderRoomInspector(run, f, layout, selectedRoomSlot, movingItem) {
  const cap = decorCap(run);
  const slotObj = selectedRoomSlot ? roomSlotById(selectedRoomSlot) : null;
  const slotItem = slotObj ? Object.entries(layout).find(([k, sid]) => sid === slotObj.id && (f.decor?.[k] ?? 0) > 0)?.[0] : null;

  let slotPanel = '';
  if (slotObj && slotItem) {
    const d = DECOR[slotItem];
    const count = f.decor[slotItem] ?? 0;
    const inStore = run.inventory?.decor?.[slotItem] ?? 0;
    const addWhy = buyAndAssignDecorBlocker(run, f.id, slotItem, slotObj.id);
    const remWhy = removeDecorBlocker(run, f.id, slotItem);
    const addLabel = inStore > 0 ? `+1 Place (${inStore} stored)` : `+1 Buy & Place (${d.price}g)`;
    slotPanel = `<div class="est-insp-sec">
      <div class="est-kicker">${esc(slotObj.label)} (${slotObj.zone})</div>
      <h3 class="est-insp-title">${esc(d.name)} <span class="est-tag gold">×${count}/${cap}</span></h3>
      <p class="sub">${esc(d.effect)}</p>
      <div class="row tight">
        ${button(addLabel, 'buy-assign-decor', { id: f.id, item: slotItem, slot: slotObj.id }, addWhy, 'btn small primary')}
        ${movingItem === slotItem
          ? '<button class="btn small" data-action="estate-move-cancel">Cancel Move</button>'
          : `<button class="btn small" data-action="estate-move-start" data-item="${slotItem}">Move Anchor</button>`}
        ${button('−1 Store', 'remove-decor', { id: f.id, item: slotItem }, remWhy, 'btn small danger')}
      </div>
      ${addWhy ? `<div class="why-not">${esc(addWhy)}</div>` : ''}
    </div>`;
  } else if (slotObj) {
    slotPanel = `<div class="est-insp-sec">
      <div class="est-kicker">Open ${slotObj.zone} anchor</div>
      <h3 class="est-insp-title">${esc(slotObj.label)}</h3>
      <p class="sub">Pick any <b>${slotObj.zone}</b> item below to place it right here, or click any item to auto-place in its matching zone.</p>
    </div>`;
  }

  const groups = [
    ['craft', 'Arena Craft (Combat Synergies)'],
    ['temperament', 'Temperament (4-Wk Humour Drift)'],
    ['comfort', 'Comfort & Renown'],
  ];

  const palette = groups.map(([gKey, gTitle]) => {
    const rows = Object.entries(DECOR).filter(([, d]) => (d.group ?? 'comfort') === gKey).map(([k, d]) => {
      const count = f.decor?.[k] ?? 0;
      const inStore = run.inventory?.decor?.[k] ?? 0;
      const zone = decorZoneOf(k);
      const preferred = slotObj && !slotItem && slotObj.zone === zone ? slotObj.id : '';
      const why = buyAndAssignDecorBlocker(run, f.id, k, preferred || null);
      const helps = d.helps(f);
      const actionLabel = inStore > 0 ? `Place (${inStore} stored)` : `${d.price}g`;
      return `<button class="est-row clickable" data-action="buy-assign-decor" data-id="${esc(f.id)}" data-item="${k}"${preferred ? ` data-slot="${preferred}"` : ''} ${why ? `disabled title="${esc(why)}"` : ''}>
        <div class="est-row-main">
          <div class="est-row-title">
            ${helps ? '<span style="color:var(--gold-bright)" title="Synergises with this fighter">✦</span> ' : ''}${esc(d.name)}
            <span class="est-tag">${zone}</span>
            <span class="est-tag gold">${esc(actionLabel)}</span>
            ${count ? `<span class="est-tag good">×${count}/${cap}</span>` : ''}
          </div>
          <div class="est-row-sub">${esc(d.effect)}${why ? ` · ${esc(why)}` : ''}</div>
        </div>
      </button>`;
    }).join('');
    return `<div class="est-group-title">${gTitle}</div><div class="est-list">${rows}</div>`;
  }).join('');

  return `${slotPanel}<div class="est-insp-sec">
    <div class="est-kicker">Decor Palette · Quarters Cap ×${cap} · ${run.gold} Gold</div>
    <p class="sub">Places from storeroom first, or buys directly for Gold. Stacking up to ×${cap} clusters props on the same anchor.</p>
    ${palette}
  </div>`;
}

function renderRoomView(run, estateUi) {
  const roster = run.roster ?? [];
  if (!roster.length) {
    return `<div class="est-empty-roster">
      <p class="sub">No fighters in your Ludus yet. Recruit a gladiator in the Market to decorate their quarters.</p>
      <button class="btn primary" data-action="estate-mode" data-mode="villa">← Back to the Villa</button>
    </div>`;
  }
  const f = roster.find((x) => x.id === estateUi.fighterId) ?? roster[0];
  const layout = resolveRoomLayout(f);
  const movingItem = estateUi.movingItem && (f.decor?.[estateUi.movingItem] ?? 0) > 0 ? estateUi.movingItem : null;
  const selectedRoomSlot = estateUi.roomSlot && roomSlotById(estateUi.roomSlot) ? estateUi.roomSlot : null;

  const { target, comfort, expects, revenant } = moraleTarget(run, f);
  const calm = decorCalm(f);
  const dom = dominantTemperament(f);
  let driftText = 'No Temperament piece';
  if (revenant) driftText = 'Revenant — temper fixed';
  else if (dom?.tied) driftText = 'Tied Temperament — drift held';
  else if (f.humourDrift && HUMORS[f.humourDrift.to]) driftText = `Turning ${HUMORS[f.humourDrift.to].name} (${f.humourDrift.weeks}/${HUMOUR_DRIFT.weeks} wks)`;
  else if (dom && dom.humor === f.humor) driftText = `Aligned (${HUMORS[f.humor].name})`;
  else if (dom && HUMORS[dom.humor]) driftText = `Pulling → ${HUMORS[dom.humor].name}`;

  const activeSynergies = Object.entries(f.decor ?? {})
    .filter(([k, n]) => n > 0 && DECOR[k]?.helps(f))
    .map(([k, n]) => `${DECOR[k].name}${n > 1 ? ` ×${n}` : ''}`);

  const hint = movingItem
    ? `Moving <b>${esc(DECOR[movingItem].name)}</b> — click any highlighted ${decorZoneOf(movingItem)} anchor to place or swap. <button class="btn small" data-action="estate-move-cancel">Cancel</button>`
    : 'Click any placed piece to stack, move or return it, or pick decor from the palette.';

  return `
    <div class="est-workspace">
      <div class="est-stage-col">
        <div class="est-bar">
          <div class="est-bar-left">
            <button class="btn small" data-action="estate-mode" data-mode="villa">← Villa Cross-Section</button>
            <h3>${esc(f.name)}'s Quarters <small>${esc(KINDS[f.kind]?.name ?? f.kind)} ${esc(clsLabel(f))} · Pow ${effectivePower(f)} · Spd ${effectiveSpeed(f)}</small></h3>
          </div>
          <span class="est-tag gold">3/4 Cutaway · Cap ×${decorCap(run)}</span>
        </div>

        <div class="est-fighter-strip" aria-label="Switch gladiator quarters">
          ${roster.map((x) => `<button class="est-fpill${x.id === f.id ? ' on' : ''}" data-action="estate-open-room" data-id="${esc(x.id)}">
            <b>${esc(x.name)}</b> <small>${esc(clsLabel(x))}</small>
          </button>`).join('')}
        </div>

        <div class="est-room-stage">
          <div class="est-room-head"><div class="sub">${hint}</div></div>
          <div class="est-room-svg-wrap">${renderRoomSvg(f, layout, selectedRoomSlot, movingItem)}</div>
          <div class="est-room-metrics">
            <div class="est-mcell">
              <div class="est-mk">Morale Target</div>
              <div class="est-mv">${target} <small>(+${decorComfortOf(f)} decor)</small></div>
              <div class="est-ms">${revenant ? 'Revenant feels nothing' : `Comfort ${comfort} vs Renown −${expects}`}</div>
            </div>
            <div class="est-mcell">
              <div class="est-mk">Weekly Calm</div>
              <div class="est-mv">−${calm} Stress</div>
              <div class="est-ms">Capped at −${STRESS.decorCalm}/wk</div>
            </div>
            <div class="est-mcell">
              <div class="est-mk">Humour &amp; Drift</div>
              <div class="est-mv">${esc(f.humor ? HUMORS[f.humor].name : '—')}</div>
              <div class="est-ms">${esc(driftText)}</div>
            </div>
            <div class="est-mcell">
              <div class="est-mk">Build Synergies</div>
              <div class="est-mv">${activeSynergies.length ? activeSynergies.length : 'None'}</div>
              <div class="est-ms">${esc(activeSynergies.join(', ') || 'Add ✦ Arena Craft pieces')}</div>
            </div>
          </div>
        </div>
      </div>
      <aside class="est-inspector" aria-label="Room decorator inspector">
        ${renderRoomInspector(run, f, layout, selectedRoomSlot, movingItem)}
      </aside>
    </div>
  `;
}

export function renderEstatePanel(run, estateUi = {}) {
  const bySlot = resolveEstateSlots(run);
  const mode = estateUi.mode === 'room' ? 'room' : 'villa';
  const unrest = isUnrestHot(run);
  const mobileFloor = ['upper', 'ground', 'catacomb'].includes(estateUi.mobileFloor) ? estateUi.mobileFloor : 'ground';
  const defaultSlot = bySlot.has('ground-0') ? 'ground-0' : ([...bySlot.keys()][0] ?? 'ground-0');
  const selectedSlot = (estateUi.slot && (plotById(estateUi.slot) || estateUi.slot === ROOF_ORACLE_SLOT)) ? estateUi.slot : defaultSlot;
  const roofOracle = bySlot.get(ROOF_ORACLE_SLOT) ?? null;

  const modeSwitch = `<div class="segs est-mode-segs" role="tablist" aria-label="Estate view">
    <button class="seg${mode === 'villa' ? ' on' : ''}" role="tab" aria-selected="${mode === 'villa'}" data-action="estate-mode" data-mode="villa">🏛 Villa Cross-Section</button>
    <button class="seg${mode === 'room' ? ' on' : ''}" role="tab" aria-selected="${mode === 'room'}" data-action="estate-mode" data-mode="room"${!(run.roster?.length) ? ' disabled title="Recruit a fighter first"' : ''}>🛏 Room Decorator</button>
  </div>`;

  if (mode === 'room') {
    return `<section class="panel estate estate-2d${unrest ? ' unrest-hot' : ''}">
      <div class="est-top-head">
        <h2>The Estate <small>${run.buildings.length}/${plotCount(run)} plots · decor cap ×${decorCap(run)}</small></h2>
        ${modeSwitch}
      </div>
      ${renderRoomView(run, estateUi)}
    </section>`;
  }

  const skySvg = `<svg class="est-sky-svg" viewBox="0 0 1100 72" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <circle cx="930" cy="22" r="14" fill="${unrest ? '#d4523b' : '#e6c57a'}" opacity="0.28"/>
    <circle cx="930" cy="22" r="8" fill="${unrest ? '#e06c55' : '#f2d99b'}" opacity="0.65"/>
    <g fill="#1c1411" opacity="0.74">
      <path d="M620 72 L620 32 Q695 22 770 32 L770 72 Z"/>
      ${[636, 656, 676, 696, 716, 736, 754].map((x) => `<rect x="${x}" y="40" width="10" height="12" rx="5" fill="${unrest ? '#4d2219' : '#38251d'}"/>`).join('')}
      ${[636, 656, 676, 696, 716, 736, 754].map((x) => `<rect x="${x}" y="56" width="10" height="12" rx="5" fill="${unrest ? '#4d2219' : '#38251d'}"/>`).join('')}
    </g>
    <path d="M72 72 Q78 20 84 72 M102 72 Q107 30 112 72 M995 72 Q1001 22 1007 72 M1024 72 Q1029 34 1034 72" fill="#17110d"/>
    <path d="M0 72 Q210 50 440 66 T900 60 T1100 68 L1100 72 Z" fill="#1a130f"/>
  </svg>`;

  const roofObs = roofOracle
    ? `<button class="est-obs-bay${selectedSlot === ROOF_ORACLE_SLOT ? ' selected' : ''}" data-action="estate-select-slot" data-slot="${ROOF_ORACLE_SLOT}">👁 Roof Observatory · ${esc(BUILDINGS[roofOracle.type].name)} (Lv ${roofOracle.level})</button>`
    : '';

  const legend = Object.entries(DEPARTMENTS).map(([k, label]) => `<span class="est-dept-dot"><i style="background:${DEPT_COLORS[k]}"></i>${esc(label)}</span>`).join('');

  return `<section class="panel estate estate-2d${unrest ? ' unrest-hot' : ''}">
    <div class="est-top-head">
      <div>
        <h2>The Estate <small>${run.buildings.length}/${plotCount(run)} plots · House level ${run.prestigeLevel} · up to ${levelInfo(run.prestigeLevel).maxFighters} fighters</small></h2>
        <p class="sub">Click any built room to inspect or upgrade, any excavated bay to build, or open Fighter Quarters to decorate your gladiators' rooms in 3/4 view.</p>
      </div>
      ${modeSwitch}
    </div>
    <div class="est-legend">${legend}</div>

    <div class="est-workspace">
      <div class="est-stage-col">
        <div class="villa est-villa">
          <div class="est-sky">${roofObs}${skySvg}</div>
          <div class="est-roof-bar">
            <span>Ludus Magnus · House Level ${run.prestigeLevel}</span>
            <span>${unrest ? '⚠ Unrest Rising — Chains Strain' : `${Math.max(0, plotsFree(run))} free plot${Math.max(0, plotsFree(run)) === 1 ? '' : 's'}`}</span>
          </div>
          <div class="est-floor-tabs" role="tablist" aria-label="Villa floors">
            ${FLOORS.map((fl) => `<button class="seg${mobileFloor === fl.id ? ' on' : ''}" role="tab" aria-selected="${mobileFloor === fl.id}" data-action="estate-mobile-floor" data-floor="${fl.id}">${esc(fl.title.split(' ')[0])}</button>`).join('')}
          </div>
          <div class="est-floors">
            ${FLOORS.map((fl) => {
              const plots = VILLA_PLOTS.filter((p) => p.floor === fl.id);
              const builtHere = plots.filter((p) => bySlot.has(p.id)).length;
              const openHere = plots.filter((p) => isPlotUnlocked(run, p)).length;
              return `<div class="est-floor ${fl.id}${mobileFloor === fl.id ? ' mobile-on' : ''}">
                <div class="est-floor-head">
                  <span class="est-floor-title">${esc(fl.title)} <small>— ${esc(fl.depth)}</small></span>
                  <small class="sub">${builtHere}/${openHere} built</small>
                </div>
                <div class="est-bays">${plots.map((p) => renderVillaBay(run, p, bySlot, selectedSlot, unrest)).join('')}</div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
      <aside class="est-inspector" aria-label="Estate inspector">
        ${renderEstateInspector(run, bySlot, selectedSlot)}
      </aside>
    </div>
  </section>`;
}
