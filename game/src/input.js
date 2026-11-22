// Emberfall — Duel of the Four Winds: input.
// One clear job: mouse clicks and keyboard, translated into game
// actions. It never changes state itself — it asks main.js to act.

import { sfx, toggleMute } from './sound.js';

// Wire one root element (event delegation over data-action attributes)
// and the keyboard. `actions` is the set of verbs main.js provides.
export function bindInput(root, actions) {
  root.addEventListener('click', (event) => {
    const el = event.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const action = el.dataset.action;
    if (action === 'play-card') actions.playCard(Number(el.dataset.index));
    else if (action === 'end-turn') actions.endTurn();
    else if (action === 'start') actions.start();
    else if (action === 'restart') actions.restart();
    else if (action === 'title') actions.toTitle();
    else if (action === 'mute') {
      const muted = toggleMute();
      el.textContent = muted ? '♪ Muted' : '♪ Sound';
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key;
    if (key >= '1' && key <= '7') {
      actions.playCard(Number(key) - 1);
    } else if (key === ' ' || key === 'Enter') {
      event.preventDefault();
      actions.confirm();
    } else if (key === 'Escape') {
      actions.toTitle();
    } else if (key === 'r' || key === 'R') {
      actions.restartIfEnded();
    } else if (key === 'm' || key === 'M') {
      toggleMute();
      actions.rerender();
    }
  });
}

// Play a short cue for what just happened, so the table feels alive.
export function cueFor(card) {
  if (!card) return;
  const e = card.effect;
  if (e.dmg) sfx.damage();
  else if (e.heal) sfx.heal();
  else if (e.shield) sfx.shield();
  else sfx.playCard();
  if (e.draw) setTimeout(() => sfx.draw(), 120);
}
