// Emberfall — Duel of the Four Winds: scripted captures.
// One clear job: drive the real game, with its real rules and its real
// rendering, into the four states the screenshots need — title, a
// mid-duel table, a win, and a loss. Nothing here fakes a screen:
// every state is reached by playing actual turns.
//
// Query: ?shot=title|play|win|loss&seed=N
//   title — the title screen
//   play  — a duel a few turns in, both sides having played cards
//   win   — autoplay until the player wins
//   loss  — autoplay with the player passing until the Warden wins

import { createGame, playCard, endTurn } from './state.js';
import { aiTakeTurn, chooseCard } from './ai.js';
import { CARD_BY_ID } from './cards.js';

// The player script for the win capture: play like a thinking player —
// damage when ahead, mend and shield when hurt, never waste a token.
function playerSmart(game) {
  let guard = 0;
  while (game.phase === 'play' && game.active === 'player' && guard < 20) {
    guard += 1;
    let best = -1;
    let bestScore = 0.6;
    for (let i = 0; i < game.player.hand.length; i++) {
      const card = CARD_BY_ID[game.player.hand[i]];
      if (card.cost > game.player.energy) continue;
      const e = card.effect;
      let s = 0;
      if (e.dmg) s += e.dmg * (game.enemy.life <= 8 ? 1.6 : 1.0);
      if (e.dmg && e.dmg >= game.enemy.life + game.enemy.shield) s += 100;
      if (e.heal) s += Math.min(e.heal, 30 - game.player.life) * (game.player.life <= 12 ? 1.4 : 0.5);
      if (e.shield) s += e.shield * (game.player.life <= 15 ? 0.9 : 0.45);
      if (e.draw) s += e.draw * 1.2;
      if (e.energy) s += e.energy * 1.6;
      s -= card.cost * 0.4;
      if (s > bestScore) {
        bestScore = s;
        best = i;
      }
    }
    if (best < 0) break;
    playCard(game, 'player', best);
  }
}

// The player script for the play capture: play one cheap card, then stop,
// so the table shows a hand mid-turn with tokens left to spend.
function playerOneCard(game) {
  let best = -1;
  let bestCost = Infinity;
  for (let i = 0; i < game.player.hand.length; i++) {
    const card = CARD_BY_ID[game.player.hand[i]];
    if (card.cost <= game.player.energy && card.effect.dmg && card.cost < bestCost) {
      bestCost = card.cost;
      best = i;
    }
  }
  if (best >= 0) playCard(game, 'player', best);
}

// Run full turns until the duel ends (or the guard trips). `playerFn`
// decides what the player does each of her turns; the AI plays itself.
function autoplay(game, playerFn) {
  let guard = 0;
  while (game.phase === 'play' && guard < 200) {
    guard += 1;
    if (game.active === 'player') {
      playerFn(game);
      if (game.phase === 'play') endTurn(game);
    } else {
      aiTakeTurn(game);
    }
  }
  return game;
}

// Build the game for one shot. Returns { game, screen } where screen is
// 'title' | 'table' | 'end'.
export function buildShot(shot, seed) {
  if (shot === 'title') return { game: null, screen: 'title' };

  if (shot === 'play') {
    const game = createGame(seed);
    // Two full rounds: player plays a card, Warden answers, repeat.
    playerOneCard(game);
    endTurn(game);
    aiTakeTurn(game);
    playerOneCard(game);
    endTurn(game);
    aiTakeTurn(game);
    playerOneCard(game);
    return { game, screen: 'table' };
  }

  if (shot === 'win') {
    const game = createGame(seed);
    autoplay(game, playerSmart);
    // The scripted player should win; if the seed says otherwise, the
    // screen still shows the real outcome of a real duel.
    return { game, screen: game.phase === 'play' ? 'table' : 'end' };
  }

  if (shot === 'loss') {
    const game = createGame(seed);
    // The player passes every turn; the Warden's damage ends it.
    autoplay(game, () => {});
    return { game, screen: game.phase === 'play' ? 'table' : 'end' };
  }

  return { game: null, screen: 'title' };
}

// Re-exported for the test harness in /tmp: pick the AI's card.
export { chooseCard };
