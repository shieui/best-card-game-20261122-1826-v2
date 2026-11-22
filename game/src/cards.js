// Emberfall — Duel of the Four Winds: the cards.
// One clear job: the whole card pool. Every card is an original
// invention for this game — new names, new numbers, new combinations.
// A card's effect is plain data: { dmg, heal, shield, draw, energy }.
//   dmg    — damage to the enemy, reduced by their shield first
//   heal   — life restored to the player of the card
//   shield — armour gained, absorbs damage until it is spent
//   draw   — cards drawn from your own deck
//   energy — extra wind tokens this turn

import { CONFIG } from './config.js';

export const CARDS = [
  // ---- Ember: raw damage, no tricks. ----
  { id: 'cinder-strike', name: 'Cinder Strike', wind: 'ember', cost: 1,
    text: 'Deal 3 damage.', effect: { dmg: 3 } },
  { id: 'flame-lash', name: 'Flame Lash', wind: 'ember', cost: 2,
    text: 'Deal 5 damage.', effect: { dmg: 5 } },
  { id: 'spark-volley', name: 'Spark Volley', wind: 'ember', cost: 2,
    text: 'Deal 4 damage. Draw 1 card.', effect: { dmg: 4, draw: 1 } },
  { id: 'ember-nova', name: 'Ember Nova', wind: 'ember', cost: 3,
    text: 'Deal 8 damage.', effect: { dmg: 8 } },

  // ---- Gale: damage that keeps your hand moving. ----
  { id: 'zephyr-cut', name: 'Zephyr Cut', wind: 'gale', cost: 1,
    text: 'Deal 2 damage. Draw 1 card.', effect: { dmg: 2, draw: 1 } },
  { id: 'breeze-feint', name: 'Breeze Feint', wind: 'gale', cost: 1,
    text: 'Deal 2 damage. Gain 1 wind token.', effect: { dmg: 2, energy: 1 } },
  { id: 'storm-talon', name: 'Storm Talon', wind: 'gale', cost: 2,
    text: 'Deal 4 damage. Draw 1 card.', effect: { dmg: 4, draw: 1 } },
  { id: 'cyclone-rush', name: 'Cyclone Rush', wind: 'gale', cost: 3,
    text: 'Deal 6 damage. Draw 1 card.', effect: { dmg: 6, draw: 1 } },

  // ---- Tide: mend yourself, drown the enemy slowly. ----
  { id: 'mending-rain', name: 'Mending Rain', wind: 'tide', cost: 1,
    text: 'Restore 4 life.', effect: { heal: 4 } },
  { id: 'tidewall', name: 'Tidewall', wind: 'tide', cost: 2,
    text: 'Gain 6 shield.', effect: { shield: 6 } },
  { id: 'deep-current', name: 'Deep Current', wind: 'tide', cost: 2,
    text: 'Restore 5 life. Draw 1 card.', effect: { heal: 5, draw: 1 } },
  { id: 'flood-surge', name: 'Flood Surge', wind: 'tide', cost: 3,
    text: 'Restore 8 life. Deal 2 damage.', effect: { heal: 8, dmg: 2 } },

  // ---- Stone: armour first, then the hammer. ----
  { id: 'pebble-guard', name: 'Pebble Guard', wind: 'stone', cost: 1,
    text: 'Gain 4 shield.', effect: { shield: 4 } },
  { id: 'shard-barrage', name: 'Shard Barrage', wind: 'stone', cost: 2,
    text: 'Deal 6 damage.', effect: { dmg: 6 } },
  { id: 'quake-slam', name: 'Quake Slam', wind: 'stone', cost: 2,
    text: 'Deal 4 damage. Gain 3 shield.', effect: { dmg: 4, shield: 3 } },
  { id: 'mountain-weight', name: "Mountain's Weight", wind: 'stone', cost: 3,
    text: 'Deal 7 damage. Gain 4 shield.', effect: { dmg: 7, shield: 4 } },
];

export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));

// Build a fresh 32-card deck: two copies of every card, shuffled.
export function buildDeck(rng) {
  const ids = [];
  for (const card of CARDS) {
    for (let i = 0; i < CONFIG.copiesPerCard; i++) ids.push(card.id);
  }
  // Shuffle inline here to keep this module self-contained.
  const out = ids.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

// A one-line summary of a card's effect, for the log and the tooltip.
export function effectSummary(card) {
  const parts = [];
  const e = card.effect;
  if (e.dmg) parts.push(`${e.dmg} damage`);
  if (e.heal) parts.push(`heal ${e.heal}`);
  if (e.shield) parts.push(`+${e.shield} shield`);
  if (e.draw) parts.push(`draw ${e.draw}`);
  if (e.energy) parts.push(`+${e.energy} energy`);
  return parts.join(', ');
}
