// What Space or Enter does on the fight screen (7.5). Pure, so it can be tested without a page.
// - While a round is still being revealed, the first press only finishes the reveal: the next round's controls (and any
//   MORTAL DANGER warning) must be seen before they can be used.
// - While MORTAL DANGER shows, the keys do nothing: fighting on (or capitulating) takes a deliberate click.
export function fightKey({ key, revealing, danger, over }) {
  if (key !== ' ' && key !== 'Enter') return 'other';
  if (revealing) return 'finish-reveal';
  if (danger && !over) return 'ignore';
  return 'press';
}
