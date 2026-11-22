// Emberfall — Duel of the Four Winds: the screen.
// One clear job: turn game state into DOM. Title, table, win and loss
// screens are all built here as plain HTML — big numbers, strong wind
// colours, and cards you can read at a glance, even shrunk to a thumbnail.

import { CONFIG, WINDS } from './config.js';
import { CARD_BY_ID, effectSummary } from './cards.js';
import { endStats } from './state.js';

// A life bar: a number you can read plus a bar you can feel.
function lifeBar(life, shield, label) {
  const pct = Math.max(0, Math.min(100, (life / CONFIG.startLife) * 100));
  const shieldBit = shield > 0 ? `<span class="shield-badge">🛡 ${shield}</span>` : '';
  return `<div class="lifebar">
    <span class="lifebar-label">${label}</span>
    <span class="lifebar-num">${life} / ${CONFIG.startLife}</span>
    <div class="lifebar-track"><div class="lifebar-fill" style="width:${pct}%"></div></div>
    ${shieldBit}
  </div>`;
}

// One card in the player's hand. Cost is a big circle, the effect a big
// number, the wind a coloured band with its own glyph and word.
function cardHtml(card, index, playable, selected) {
  const wind = WINDS[card.wind];
  const e = card.effect;
  const big = e.dmg ? e.dmg : e.heal ? `+${e.heal}` : e.shield ? `+${e.shield}` : '';
  const bigWord = e.dmg ? 'DMG' : e.heal ? 'HEAL' : e.shield ? 'SHIELD' : 'WIND';
  return `<button class="card wind-${card.wind}${playable ? ' playable' : ''}${selected ? ' selected' : ''}"
      data-action="play-card" data-index="${index}" title="${card.name} — ${effectSummary(card)}">
    <span class="card-cost">${card.cost}</span>
    <span class="card-wind" style="background:${wind.color}">${wind.glyph} ${wind.name}</span>
    <span class="card-name">${card.name}</span>
    <span class="card-big">${big}</span>
    <span class="card-bigword">${bigWord}</span>
    <span class="card-text">${card.text}</span>
  </button>`;
}

// The back of an opponent card: a wind-coloured tile with a glyph.
function cardBackHtml() {
  return `<div class="card-back"><span>✦</span></div>`;
}

// ---- Title screen ----
export function titleHtml() {
  const legend = Object.entries(WINDS).map(([key, w]) => `
    <div class="legend-wind"><span class="legend-glyph" style="background:${w.color}">${w.glyph}</span>
    <b>${w.name}</b> — ${w.blurb}</div>`).join('');
  return `<div class="screen title-screen">
    <div class="title-ember">✦</div>
    <h1 class="game-title">EMBERFALL</h1>
    <p class="game-subtitle">Duel of the Four Winds</p>
    <p class="title-tagline">Four winds. One ember. Thirty life. Spend your wind
      tokens, play your cards, and put out Gale Warden's flame before she puts out yours.</p>
    <div class="legend">${legend}</div>
    <div class="howto">
      <b>How to play:</b> Click a card (or press 1–7) to play it · Each card costs wind tokens ·
      You get 3 tokens and draw 2 cards every turn · Playing two cards of one wind in a turn
      makes the second hit <b>+2 damage</b> (Wind Surge) · Shield blocks damage · First to 0 life loses.
    </div>
    <button class="big-button" data-action="start">Begin the Duel</button>
    <p class="title-hint">Press Enter to begin · M toggles sound</p>
  </div>`;
}

// A small played-card tile for the felt: name, wind colour, big number.
function playedTile(card) {
  if (!card) return '<div class="played-empty">—</div>';
  const wind = WINDS[card.wind];
  const e = card.effect;
  const big = e.dmg ? e.dmg : e.heal ? `+${e.heal}` : e.shield ? `+${e.shield}` : '';
  return `<div class="played-tile" style="border-color:${wind.color}">
    <span class="played-wind" style="background:${wind.color}">${wind.glyph} ${wind.name}</span>
    <span class="played-name">${card.name}</span>
    <span class="played-big">${big}</span>
  </div>`;
}

// ---- The table ----
export function tableHtml(game) {
  const p = game.player;
  const e = game.enemy;
  const enemyBacks = e.hand.map(() => cardBackHtml()).join('');
  const hand = p.hand.map((id, i) => {
    const card = CARD_BY_ID[id];
    const playable = game.phase === 'play' && game.active === 'player' && card.cost <= p.energy;
    return cardHtml(card, i, playable, false);
  }).join('');
  const energyPips = Array.from({ length: CONFIG.maxEnergy }, (_, i) =>
    `<span class="pip${i < p.energy ? ' on' : ''}"></span>`).join('');
  const logLines = game.log.slice(0, 8).map((line) => `<div class="log-line">${line}</div>`).join('');
  const turnNote = game.active === 'player' ? 'Your turn — play a card or end your turn'
    : "Gale Warden is thinking…";
  const endDisabled = game.active !== 'player' || game.phase !== 'play';
  const lastYou = game.lastPlayed.player ? CARD_BY_ID[game.lastPlayed.player] : null;
  const lastFoe = game.lastPlayed.enemy ? CARD_BY_ID[game.lastPlayed.enemy] : null;
  return `<div class="screen table-screen">
    <header class="table-top">
      <span class="brand">✦ EMBERFALL</span>
      <span class="turn-pill">Turn ${game.turn} · ${turnNote}</span>
      <button class="mute-btn" data-action="mute" title="Toggle sound (M)">♪ Sound</button>
    </header>
    <section class="foe-row">
      <div class="foe-id">
        <div class="foe-avatar">🌪</div>
        <div><div class="foe-name">Gale Warden</div>
        <div class="foe-sub">AI opponent · ${e.hand.length} cards in hand · ${e.deck.length} left in deck</div></div>
      </div>
      ${lifeBar(e.life, e.shield, 'Warden life')}
      <div class="foe-hand">${enemyBacks}</div>
    </section>
    <section class="middle">
      <div class="felt">
        <div class="played-row">
          <div class="played-side"><span class="played-label">Warden played</span>${playedTile(lastFoe)}</div>
          <div class="felt-mid"><div class="felt-wind">✦</div><div class="felt-words">DUEL OF THE FOUR WINDS</div></div>
          <div class="played-side"><span class="played-label">You played</span>${playedTile(lastYou)}</div>
        </div>
        <div class="felt-score">You ${p.life} — ${e.life} Warden</div>
      </div>
      <aside class="log" aria-label="Duel log">${logLines}</aside>
    </section>
    <section class="me-row">
      ${lifeBar(p.life, p.shield, 'Your life')}
      <div class="energy">
        <span class="energy-label">Wind tokens</span>
        <span class="pips">${energyPips}</span>
        <span class="energy-num">${p.energy}</span>
      </div>
      <button class="end-turn${endDisabled ? ' disabled' : ''}" data-action="end-turn" ${endDisabled ? 'disabled' : ''}>End Turn ⏎</button>
    </section>
    <section class="hand" aria-label="Your hand">${hand || '<div class="hand-empty">Your hand is empty.</div>'}</section>
    <footer class="table-foot">Keys: 1–7 play a card · Space ends your turn · M sound · Esc title</footer>
  </div>`;
}

// ---- Win / loss screens ----
export function endHtml(game) {
  const won = game.phase === 'won';
  const s = endStats(game);
  return `<div class="screen end-screen ${won ? 'end-win' : 'end-lose'}">
    <div class="end-ember">${won ? '🔥' : '🌫'}</div>
    <h1 class="end-title">${won ? 'VICTORY' : 'DEFEAT'}</h1>
    <p class="end-sub">${won
      ? 'The last ember falls. Gale Warden bows to the new master of the four winds.'
      : 'Your ember gutters out. Gale Warden keeps the winds — this time.'}</p>
    <div class="end-stats">
      <div class="stat"><span class="stat-num">${s.turns}</span><span class="stat-word">turns</span></div>
      <div class="stat"><span class="stat-num">${s.damageDealt}</span><span class="stat-word">damage dealt</span></div>
      <div class="stat"><span class="stat-num">${s.damageTaken}</span><span class="stat-word">damage taken</span></div>
      <div class="stat"><span class="stat-num">${s.cardsPlayed}</span><span class="stat-word">cards played</span></div>
      <div class="stat"><span class="stat-num">${s.surges}</span><span class="stat-word">wind surges</span></div>
    </div>
    <button class="big-button" data-action="restart">Play Again</button>
    <button class="ghost-button" data-action="title">Back to Title</button>
    <p class="title-hint">Press R to play again</p>
  </div>`;
}
