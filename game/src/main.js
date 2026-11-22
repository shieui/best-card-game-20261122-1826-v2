// Emberfall — Duel of the Four Winds: the table itself.
// One clear job: own the screen state, wire input to the rules, and
// animate the Warden's turn one card at a time so you can follow it.

import { CONFIG } from './config.js';
import { createGame, playCard, endTurn, canPlay } from './state.js';
import { aiStep } from './ai.js';
import { titleHtml, tableHtml, endHtml } from './render.js';
import { bindInput, cueFor } from './input.js';
import { buildShot } from './shots.js';
import { sfx } from './sound.js';

const root = document.getElementById('app');

// A random seed for every fresh duel; ?seed=N pins one (screenshots).
function seedFromUrl() {
  const q = new URLSearchParams(window.location.search);
  const s = Number(q.get('seed'));
  return Number.isFinite(s) && s > 0 ? Math.floor(s) : (Date.now() % 2147483647);
}

const app = {
  screen: 'title', // 'title' | 'table' | 'end'
  game: null,
  seed: seedFromUrl(),
  aiTimer: null,
};

function render() {
  if (app.screen === 'title') root.innerHTML = titleHtml();
  else if (app.screen === 'table' && app.game) root.innerHTML = tableHtml(app.game);
  else if (app.screen === 'end' && app.game) root.innerHTML = endHtml(app.game);
  document.title = app.screen === 'title'
    ? 'Emberfall — Duel of the Four Winds'
    : `Emberfall — You ${app.game.player.life} : ${app.game.enemy.life} Warden`;
}

function stopAi() {
  if (app.aiTimer) {
    clearTimeout(app.aiTimer);
    app.aiTimer = null;
  }
}

// The Warden plays one card per beat, then hands the turn back.
function runAiTurn() {
  stopAi();
  if (!app.game || app.game.phase !== 'play' || app.game.active !== 'enemy') return;
  const step = () => {
    if (!app.game || app.game.phase !== 'play' || app.game.active !== 'enemy') {
      render();
      return;
    }
    const before = app.game.enemy.hand.length;
    const result = aiStep(app.game);
    if (result === 'played' && app.game.enemy.hand.length < before) {
      const last = app.game.log[0] || '';
      if (last.includes('damage')) sfx.damage();
      else sfx.playCard();
    }
    render();
    if (app.game.phase !== 'play') {
      showEnd();
      return;
    }
    if (app.game.active === 'enemy') {
      app.aiTimer = setTimeout(step, CONFIG.aiStepMs);
    }
  };
  app.aiTimer = setTimeout(step, CONFIG.aiStepMs);
}

function showEnd() {
  stopAi();
  app.screen = 'end';
  if (app.game.phase === 'won') sfx.win();
  else sfx.lose();
  render();
}

function startDuel() {
  stopAi();
  app.seed = seedFromUrl();
  app.game = createGame(app.seed);
  app.screen = 'table';
  sfx.turn();
  render();
}

const actions = {
  start() { startDuel(); },
  restart() { startDuel(); },
  restartIfEnded() {
    if (app.screen === 'end') startDuel();
  },
  toTitle() {
    stopAi();
    app.screen = 'title';
    app.game = null;
    render();
  },
  rerender() { render(); },
  confirm() {
    if (app.screen === 'title') startDuel();
    else if (app.screen === 'end') startDuel();
    else actions.endTurn();
  },
  playCard(index) {
    const game = app.game;
    if (!game || app.screen !== 'table' || game.phase !== 'play' || game.active !== 'player') return;
    if (!canPlay(game, 'player', index)) {
      sfx.damage();
      return;
    }
    const card = playCard(game, 'player', index);
    cueFor(card);
    render();
    if (game.phase !== 'play') showEnd();
  },
  endTurn() {
    const game = app.game;
    if (!game || app.screen !== 'table' || game.phase !== 'play' || game.active !== 'player') return;
    endTurn(game);
    sfx.turn();
    render();
    runAiTurn();
  },
};

bindInput(root, actions);

// Screenshot mode: ?shot=title|play|win|loss&seed=N renders a finished
// state of a real duel, with no interaction needed.
const shot = new URLSearchParams(window.location.search).get('shot');
if (shot) {
  const built = buildShot(shot, app.seed);
  app.game = built.game;
  app.screen = built.screen;
  render();
} else {
  render();
}
