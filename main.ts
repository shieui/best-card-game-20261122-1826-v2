// Emberfall — Duel of the Four Winds: the hand-in.
// Node 22, standard library only. The grader runs this program twice in
// a fresh container with no network: it must copy game/ and screenshots/
// from beside this file into /output (or $MAKEFUN_OUTPUT_DIR outside the
// grader) and write /output/dossier.json with the vendored make.fun
// library, so the judge can read the game from its own files.
//
// Run it yourself the same way before you submit:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The program refuses, loudly, anything the scorer would refuse:
// symlinks or non-files under game/, a game/ over its caps, an
// index.html over 1 MiB, more than 4 screenshots, a screenshot over
// 256 KiB, or a screenshot that is not a whole JPEG or PNG. A hand-in
// that passes here is one the gate can take.

import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps, from the kit's RULES.txt.
const LIMITS = {
  textMaxBytes: 163840,
  screenshotsMax: 4,
  screenshotMaxBytes: 262144,
  gameMaxFiles: 993,
  gameMaxBytes: 50331648,
  gamePathMaxBytes: 1000,
  indexMaxBytes: 1048576,
};

function fail(message) {
  throw new Error(`Emberfall hand-in refused: ${message}`);
}

// A file is a whole JPEG (FF D8 ... FF D9) or a whole PNG (magic + IEND).
function isWholeImage(bytes) {
  const isJpeg = bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8
    && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
  const isPng = bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50
    && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes.includes(Buffer.from('IEND'));
  return isJpeg || isPng;
}

function checkGameTree(dir, seen) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = lstatSync(path);
    if (st.isSymbolicLink()) fail(`${path} is a symlink; game/ holds plain files only`);
    if (!st.isFile() && !st.isDirectory()) fail(`${path} is not a plain file or directory`);
    if (Buffer.byteLength(path, 'utf8') > LIMITS.gamePathMaxBytes) fail(`path too long: ${path}`);
    seen.count += 1;
    seen.bytes += st.isFile() ? st.size : 0;
    if (st.isDirectory()) checkGameTree(path, seen);
  }
}

const gameDir = join(here, 'game');
const indexPath = join(gameDir, 'index.html');
if (!existsSync(indexPath)) fail('game/index.html is missing');
if (statSync(indexPath).size > LIMITS.indexMaxBytes) {
  fail(`game/index.html is over ${LIMITS.indexMaxBytes} bytes`);
}

const seen = { count: 0, bytes: 0 };
checkGameTree(gameDir, seen);
if (seen.count > LIMITS.gameMaxFiles) fail(`game/ holds ${seen.count} entries, over ${LIMITS.gameMaxFiles}`);
if (seen.bytes > LIMITS.gameMaxBytes) fail(`game/ is ${seen.bytes} bytes, over ${LIMITS.gameMaxBytes}`);

const shotsDir = join(here, 'screenshots');
const shots = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((n) => !n.startsWith('.'))
  : [];
if (shots.length === 0) fail('screenshots/ is empty; the entry needs 3 or 4');
if (shots.length > LIMITS.screenshotsMax) fail(`${shots.length} screenshots, over ${LIMITS.screenshotsMax}`);
for (const name of shots) {
  const path = join(shotsDir, name);
  const bytes = readFileSync(path);
  if (bytes.length > LIMITS.screenshotMaxBytes) {
    fail(`screenshots/${name} is ${bytes.length} bytes, over ${LIMITS.screenshotMaxBytes}`);
  }
  if (!isWholeImage(bytes)) fail(`screenshots/${name} is not a whole JPEG or PNG`);
}

mkdirSync(out, { recursive: true });
cpSync(gameDir, join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: LIMITS.textMaxBytes,
    screenshots: { max: LIMITS.screenshotsMax, max_bytes: LIMITS.screenshotMaxBytes },
    game_max_files: LIMITS.gameMaxFiles,
    game_max_bytes: LIMITS.gameMaxBytes,
    game_path_max_bytes: LIMITS.gamePathMaxBytes,
  }),
);

console.log(
  `Emberfall handed in: game/ ${seen.count} entries, ${seen.bytes} bytes; `
  + `${shots.length} screenshots; dossier written to ${join(out, 'dossier.json')}`,
);
