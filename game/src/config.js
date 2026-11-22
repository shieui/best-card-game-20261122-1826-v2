// Emberfall — Duel of the Four Winds: tuning constants.
// One clear job: every number the rules use lives here, so balancing
// never means hunting through the logic.

export const CONFIG = {
  // Life totals. A duel ends the moment either side reaches zero.
  startLife: 30,
  // Wind tokens refilled at the start of your turn; cards spend them.
  energyPerTurn: 3,
  maxEnergy: 10,
  // Hand rules.
  handStart: 5,
  drawPerTurn: 2,
  maxHand: 7,
  // How many copies of each card go into a 32-card deck.
  copiesPerCard: 2,
  // Wind Surge: the second (and later) card of one wind played in the
  // same turn deals +2 damage when it deals any damage at all.
  surgeBonus: 2,
  // The AI waits this long (ms) between its plays so you can follow it.
  aiStepMs: 650,
  // Screen size the table is laid out for.
  tableWidth: 1280,
  tableHeight: 800,
};

// The four winds. Colour and shape carry the identity, never text alone:
// each wind has its own colour, its own glyph shape, and its own word.
export const WINDS = {
  ember: { name: 'Ember', color: '#e2483d', dark: '#8f1f18', glyph: '▲', blurb: 'Raw damage' },
  gale: { name: 'Gale', color: '#3fae5a', dark: '#1d6b32', glyph: '◆', blurb: 'Damage and draw' },
  tide: { name: 'Tide', color: '#3d8be2', dark: '#1c4f8f', glyph: '●', blurb: 'Heal and shield' },
  stone: { name: 'Stone', color: '#c98a2b', dark: '#7a5210', glyph: '■', blurb: 'Shield and slam' },
};

export const WIND_ORDER = ['ember', 'gale', 'tide', 'stone'];
