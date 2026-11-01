// Keeps docs/text-to-rewrite.md pointing at the right lines. Usage: node scripts/text-index.js [--check]
// Every table row links a file and line to the text found there. After the code moves, this finds each row's text again
// (the line sharing most of it, nearest its old line) and rewrites the link. Rows whose text can't be found, or seems to
// have changed, are listed. --check changes nothing and exits non-zero if any link is out of date.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOC = join(root, 'docs', 'text-to-rewrite.md');
const ROW = /^\| \[(src\/[\w/.-]+):(\d+)\]\(\.\.\/src\/[\w/.-]+#L\d+\) \| (.*)$/;

// Rows that describe a table rather than quote it are found by the table's declaration.
const ANCHORS = {
  'Fighter name pool': 'export const NAMES',
  'Kinds and their traits': 'export const KINDS',
  Classes: 'export const CLASSES',
  Buildings: 'export const BUILDINGS',
  'Fight items': 'export const CONSUMABLES',
  "Gods' Days (festivals)": 'export const FESTIVALS',
  'Boss arena rules': 'export const BOSS_DEBUFFS',
  Decor: 'export const DECOR',
  Scars: 'export const SCARS',
};

const QUOTES = /[`'"\\]/g;
// Probes for a row's text: runs of four words (placeholders, markup and quote marks removed), tried against each line.
export function probesOf(text) {
  const plain = text
    .replace(/^\(starts here, several lines\)\s*/, '')
    .replace(/\*\*/g, '')
    .replace(/\s*\|\s*$/, '');
  if (ANCHORS[plain.trim()]) return [ANCHORS[plain.trim()]];
  const body = plain.replace(/^(Title|Choice|Body|Label|Say|Goal|Name|Desc|Epithet|Line): /, '');
  const out = [];
  // Split at ${...} and {f}-style placeholders; long pieces give four-word windows, short ones are tried whole.
  for (const piece of body.split(/\$\{[^}]*\}|\{\w+\}|[()]/)) {
    const words = piece.replace(QUOTES, '').split(/\s+/).filter(Boolean);
    if (words.length >= 4) for (let i = 0; i + 4 <= words.length; i++) out.push(words.slice(i, i + 4).join(' '));
    else if (words.join(' ').length >= 4) out.push(words.join(' '));
  }
  return out;
}

const norm = (line) => line.replace(QUOTES, '').replace(/\s+/g, ' ');

export function refresh(markdown, readFile) {
  const files = new Map();
  const lines = (f) => {
    if (!files.has(f)) files.set(f, readFile(f).split('\n').map(norm));
    return files.get(f);
  };
  const missing = [];
  const changed = [];
  let moved = 0;
  const out = markdown.split('\n').map((row) => {
    const m = row.match(ROW);
    if (!m) return row;
    const [, file, oldLine, text] = m;
    const probes = probesOf(text);
    const probe = probes[0] ?? '';
    let src;
    try {
      src = lines(file);
    } catch {
      missing.push({ file, line: Number(oldLine), text: probe });
      return row;
    }
    // The line sharing the most of the row's probes wins; ties go to the line nearest the old one.
    let best = null;
    let bestScore = 0;
    src.forEach((l, i) => {
      const score = probes.filter((p) => l.includes(p)).length;
      if (score > bestScore || (score && score === bestScore && Math.abs(i + 1 - oldLine) < Math.abs(best - oldLine))) {
        best = i + 1;
        bestScore = score;
      }
    });
    if (best === null) {
      missing.push({ file, line: Number(oldLine), text: probe });
      return row;
    }
    // Under half the probes found: the text in the code has probably changed since the index was written.
    if (bestScore < probes.length / 2 && !text.startsWith('(starts here')) changed.push({ file, line: best, text: probe });
    if (best !== Number(oldLine)) moved++;
    return `| [${file}:${best}](../${file}#L${best}) | ${text}`;
  });
  return { markdown: out.join('\n'), missing, changed, moved };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const { markdown, missing, changed, moved } = refresh(readFileSync(DOC, 'utf8'), (f) => readFileSync(join(root, f), 'utf8'));
  if (!check) {
    const today = new Date().toISOString().slice(0, 10);
    writeFileSync(DOC, markdown.replace(/Generated from the code on [\d-]+/, `Generated from the code on ${today}`));
    console.log(`${moved} links moved.`);
  }
  for (const x of missing) console.log(`Not found: ${x.file}:${x.line} "${x.text}"`);
  for (const x of changed) console.log(`Changed?  ${x.file}:${x.line} "${x.text}"`);
  if (check && (missing.length || moved)) process.exit(1);
}
