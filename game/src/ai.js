// Emberfall — Duel of the Four Winds: the AI opponent.
// One clear job: decide what Gale Warden does on her turn. She reads
// the board like a player would — hurt you when she can, mend herself
// when she must, and never waste a token on nothing.

import { CARD_BY_ID } from './cards.js';
import { canPlay, playCard, endTurn } from './state.js';

// Score one card in the current position. Higher is better.
export function scoreCard(game, card) {
  const me = game.enemy;
  const you = game.player;
  const e = card.effect;
  let score = 0;
  if (e.dmg) {
    // Damage is worth more the closer you are to falling.
    score += e.dmg * (you.life <= 8 ? 1.6 : 1.0);
    // Lethal damage is worth everything.
    if (e.dmg >= you.life + you.shield) score += 100;
  }
  if (e.heal) {
    // Healing matters when hurt, and never above full life.
    const missing = 30 - me.life;
    score += Math.min(e.heal, missing) * (me.life <= 12 ? 1.4 : 0.5);
  }
  if (e.shield) {
    // Shield matters when your life is threatened.
    score += e.shield * (you.life >= 10 && me.life <= 15 ? 0.9 : 0.45);
  }
  if (e.draw) score += e.draw * 1.2;
  if (e.energy) score += e.energy * 1.6;
  // A cheap card that does something beats holding tokens.
  score -= card.cost * 0.4;
  return score;
}

// Pick the best affordable card index, or -1 when nothing is worth it.
export function chooseCard(game) {
  const hand = game.enemy.hand;
  let best = -1;
  let bestScore = 0.6; // below this, holding the card is better
  for (let i = 0; i < hand.length; i++) {
    if (!canPlay(game, 'enemy', i)) continue;
    const card = CARD_BY_ID[hand[i]];
    const jitter = (game.rng() - 0.5) * 0.8; // a little unpredictability
    const s = scoreCard(game, card) + jitter;
    if (s > bestScore) {
      bestScore = s;
      best = i;
    }
  }
  return best;
}

// Play one AI step: a single card, or end the turn when done.
// Returns 'played' or 'ended'.
export function aiStep(game) {
  if (game.phase !== 'play' || game.active !== 'enemy') return 'ended';
  const index = chooseCard(game);
  if (index < 0) {
    endTurn(game);
    return 'ended';
  }
  playCard(game, 'enemy', index);
  return 'played';
}

// Run the whole AI turn at once (no delays): used by tests, shot
// captures, and the autoplay that reaches the end screens.
export function aiTakeTurn(game) {
  let guard = 0;
  while (game.phase === 'play' && game.active === 'enemy' && guard < 40) {
    guard += 1;
    if (aiStep(game) === 'ended') break;
  }
  return game.phase;
}
