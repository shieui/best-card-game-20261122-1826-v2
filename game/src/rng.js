// Emberfall — Duel of the Four Winds: deterministic randomness.
// One clear job: a tiny seeded PRNG so a duel can be replayed exactly
// from its seed (screenshots, tests, and rematches all use it).

// mulberry32: small, fast, and good enough for shuffling a deck.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher–Yates shuffle driven by the seeded RNG. Returns a new array.
export function shuffle(deck, rng) {
  const out = deck.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

// Pick one element of an array with the seeded RNG.
export function pickOne(list, rng) {
  return list[Math.floor(rng() * list.length)];
}
