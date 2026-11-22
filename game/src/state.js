// Emberfall — Duel of the Four Winds: the rules.
// One clear job: the whole duel as pure data and pure functions —
// create it, start turns, play cards, take damage, decide the winner.
// Nothing here touches the screen; render.js reads this state.

import { CONFIG } from './config.js';
import { CARD_BY_ID, buildDeck } from './cards.js';
import { makeRng } from './rng.js';

export function newSide() {
  return { life: CONFIG.startLife, shield: 0, energy: 0, hand: [], deck: [], discard: [] };
}

// Start a duel. `seed` drives both decks and the AI, so the same seed
// always deals the same duel.
export function createGame(seed) {
  const rng = makeRng(seed);
  const game = {
    seed,
    rng,
    turn: 1,
    phase: 'play', // 'play' | 'won' | 'lost'
    active: 'player', // whose turn it is
    player: newSide(),
    enemy: newSide(),
    // Winds played this turn, per side, for the Wind Surge bonus.
    windsPlayed: { player: {}, enemy: {} },
    // The last card each side played, shown on the felt.
    lastPlayed: { player: null, enemy: null },
    log: [],
    stats: { damageDealt: 0, damageTaken: 0, cardsPlayed: 0, surges: 0 },
  };
  game.player.deck = buildDeck(makeRng(seed ^ 0x9e3779b9));
  game.enemy.deck = buildDeck(makeRng(seed ^ 0x51ed2703));
  drawCards(game, 'player', CONFIG.handStart);
  drawCards(game, 'enemy', CONFIG.handStart);
  startTurn(game, 'player');
  log(game, 'The duel begins. Four winds, one ember left burning.');
  return game;
}

export function log(game, text) {
  game.log.unshift(text);
  if (game.log.length > 40) game.log.length = 40;
}

// Draw up to `n` cards, respecting the hand cap; extras are burned.
export function drawCards(game, who, n) {
  const side = game[who];
  for (let i = 0; i < n; i++) {
    if (side.hand.length >= CONFIG.maxHand) {
      if (side.deck.length) side.discard.push(side.deck.pop());
      continue;
    }
    if (!side.deck.length) {
      // Out of cards: reshuffle the discard pile back in.
      side.deck = side.discard;
      side.discard = [];
      const rng = game.rng;
      for (let k = side.deck.length - 1; k > 0; k--) {
        const j = Math.floor(rng() * (k + 1));
        const tmp = side.deck[k];
        side.deck[k] = side.deck[j];
        side.deck[j] = tmp;
      }
      if (!side.deck.length) return;
    }
    side.hand.push(side.deck.pop());
  }
}

// Open a side's turn: refill energy, draw, clear the surge tally.
export function startTurn(game, who) {
  const side = game[who];
  game.active = who;
  side.energy = CONFIG.energyPerTurn;
  game.windsPlayed[who] = {};
  if (game.turn > 1 || who === 'enemy') drawCards(game, who, CONFIG.drawPerTurn);
  log(game, `${who === 'player' ? 'Your' : "Gale Warden's"} turn ${game.turn} — ${side.energy} wind tokens.`);
}

// Damage first eats shield, then life. Returns life actually lost.
export function dealDamage(game, who, amount) {
  const side = game[who];
  let left = amount;
  const absorbed = Math.min(side.shield, left);
  side.shield -= absorbed;
  left -= absorbed;
  side.life = Math.max(0, side.life - left);
  if (who === 'enemy') game.stats.damageDealt += left;
  if (who === 'player') game.stats.damageTaken += left;
  return left;
}

// Can this side afford and play this hand index right now?
export function canPlay(game, who, index) {
  if (game.phase !== 'play' || game.active !== who) return false;
  const side = game[who];
  const id = side.hand[index];
  if (id === undefined) return false;
  return CARD_BY_ID[id].cost <= side.energy;
}

// Play the card at `index` from `who`'s hand. Returns the card, or null
// when the play is illegal.
export function playCard(game, who, index) {
  if (!canPlay(game, who, index)) return null;
  const side = game[who];
  const foe = who === 'player' ? 'enemy' : 'player';
  const card = CARD_BY_ID[side.hand[index]];
  side.energy -= card.cost;
  side.hand.splice(index, 1);
  side.discard.push(card.id);
  game.stats.cardsPlayed += 1;
  game.lastPlayed[who] = card.id;

  // Wind Surge: a second card of the same wind this turn hits +2 harder.
  const tally = game.windsPlayed[who];
  tally[card.wind] = (tally[card.wind] || 0) + 1;
  let surged = false;
  let dmg = card.effect.dmg || 0;
  if (dmg && tally[card.wind] >= 2) {
    dmg += CONFIG.surgeBonus;
    surged = true;
    game.stats.surges += 1;
  }

  const whoName = who === 'player' ? 'You' : 'Gale Warden';
  const verb = who === 'player'
    ? (surged ? 'unleash a surging' : 'play')
    : (surged ? 'unleashes a surging' : 'plays');
  const bits = [];
  if (dmg) bits.push(`${dmg} damage`);
  if (card.effect.heal) bits.push(`heal ${card.effect.heal}`);
  if (card.effect.shield) bits.push(`+${card.effect.shield} shield`);
  if (card.effect.draw) bits.push(`draw ${card.effect.draw}`);
  if (card.effect.energy) bits.push(`+${card.effect.energy} energy`);
  log(game, `${whoName} ${verb} ${card.name} (${bits.join(', ')}).`);

  if (dmg) dealDamage(game, foe, dmg);
  if (card.effect.heal) {
    side.life = Math.min(CONFIG.startLife, side.life + card.effect.heal);
  }
  if (card.effect.shield) side.shield += card.effect.shield;
  if (card.effect.energy) side.energy = Math.min(CONFIG.maxEnergy, side.energy + card.effect.energy);
  if (card.effect.draw) drawCards(game, who, card.effect.draw);

  updatePhase(game);
  return card;
}

// End `who`'s turn and open the other's. Returns the side now active.
export function endTurn(game) {
  if (game.phase !== 'play') return game.active;
  const next = game.active === 'player' ? 'enemy' : 'player';
  if (next === 'player') game.turn += 1;
  startTurn(game, next);
  return next;
}

// Decide whether the duel is over.
export function updatePhase(game) {
  if (game.enemy.life <= 0) {
    game.phase = 'won';
    log(game, 'The last ember falls. You win the duel!');
  } else if (game.player.life <= 0) {
    game.phase = 'lost';
    log(game, 'Your ember gutters out. Gale Warden wins.');
  }
}

// The duel's headline numbers for the end screens.
export function endStats(game) {
  return {
    turns: game.turn,
    damageDealt: game.stats.damageDealt,
    damageTaken: game.stats.damageTaken,
    cardsPlayed: game.stats.cardsPlayed,
    surges: game.stats.surges,
  };
}
