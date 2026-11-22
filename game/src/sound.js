// Emberfall — Duel of the Four Winds: sound.
// One clear job: tiny synthesized blips from the Web Audio API —
// no sound files, nothing to download. Silent until the first
// interaction, as browsers require, and mutable with M.

let ctx = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

// A short tone: frequency in Hz, length in seconds, 'sine' or 'triangle'.
export function blip(freq, seconds, type) {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + seconds);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + seconds);
  } catch (err) {
    void err; // audio is decoration; never break the game for it
  }
}

export const sfx = {
  playCard() { blip(520, 0.12, 'triangle'); blip(780, 0.1, 'sine'); },
  damage() { blip(180, 0.18, 'triangle'); },
  heal() { blip(660, 0.2, 'sine'); blip(880, 0.22, 'sine'); },
  shield() { blip(340, 0.15, 'triangle'); },
  draw() { blip(940, 0.07, 'sine'); },
  turn() { blip(440, 0.09, 'sine'); },
  win() { blip(523, 0.16, 'triangle'); setTimeout(() => blip(659, 0.16, 'triangle'), 140); setTimeout(() => blip(784, 0.3, 'triangle'), 280); },
  lose() { blip(392, 0.2, 'triangle'); setTimeout(() => blip(311, 0.2, 'triangle'), 180); setTimeout(() => blip(233, 0.4, 'triangle'), 360); },
};
