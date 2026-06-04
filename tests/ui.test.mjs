import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Load the REAL external stylesheet (simulates the cached/loaded styles.css)
const realCss = readFileSync(resolve(root, 'src/ui/styles.css'), 'utf8');

// Real index.html body structure
const bodyHtml = `
  <canvas id="game-canvas"></canvas>
  <div id="ui-overlay">
    <div id="loading-screen" class="ui-screen"></div>
    <div id="main-menu" class="ui-screen hidden"></div>
    <div id="mode-selector" class="ui-screen hidden"></div>
    <div id="player-creator" class="ui-screen hidden"></div>
    <div id="my-players" class="ui-screen hidden"></div>
    <div id="pack-store" class="ui-screen hidden"></div>
    <div id="spin-wheel" class="ui-screen hidden"></div>
    <div id="settings" class="ui-screen hidden"></div>
    <div id="hud" class="ui-screen hidden"></div>
  </div>
  <div id="result-modal" class="modal-overlay hidden"></div>
  <div id="halftime-modal" class="halftime-screen hidden"></div>
`;

const dom = new JSDOM(
  `<!DOCTYPE html><html><head><style>${realCss}</style></head><body>${bodyHtml}</body></html>`,
  { pretendToBeVisual: true, url: 'http://localhost/', runScripts: 'outside-only' }
);

const { window } = dom;

// ---- Globals for the module under test ----
global.window = window;
global.document = window.document;
global.localStorage = window.localStorage;
global.CustomEvent = window.CustomEvent;
global.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);

// Stub canvas 2D context (jsdom has no real canvas)
const noop = () => {};
const fakeCtx = new Proxy({
  createLinearGradient: () => ({ addColorStop: noop }),
  createRadialGradient: () => ({ addColorStop: noop }),
  measureText: () => ({ width: 10 }),
}, { get: (t, p) => (p in t ? t[p] : noop) });
window.HTMLCanvasElement.prototype.getContext = () => fakeCtx;

// ---- Import the REAL UIManager ----
const { UIManager } = await import(resolve(root, 'src/ui/UIManager.js'));

// Fake GameManager with the methods/props UIManager touches
const fakeGM = { on: noop, state: 'menu', players: [], possession: 0,
  startGame: noop, stopGame: noop, pauseGame: noop, resumeGame: noop };

const ui = new UIManager(fakeGM);

// ---- ASSERTIONS ----
const gcs = (id) => window.getComputedStyle(window.document.getElementById(id));
let pass = 0, fail = 0;
function check(name, cond, got) {
  if (cond) { console.log(`  ✅ ${name}`); pass++; }
  else { console.log(`  ❌ ${name}  (got: ${got})`); fail++; }
}

console.log('\n=== UI Overlay / Click-Blocker Tests ===');
check('#halftime-modal is hidden (was the dark click-blocker)',
  gcs('halftime-modal').display === 'none', gcs('halftime-modal').display);
check('#result-modal is hidden',
  gcs('result-modal').display === 'none', gcs('result-modal').display);
check('#main-menu is visible',
  gcs('main-menu').display !== 'none', gcs('main-menu').display);
check('#loading-screen hidden after init',
  gcs('loading-screen').display === 'none', gcs('loading-screen').display);
check('#hud hidden in menu',
  gcs('hud').display === 'none', gcs('hud').display);

console.log('\n=== Menu Buttons Present & Wired ===');
const menu = window.document.getElementById('main-menu');
const offlineBtn = menu.querySelector('#btn-offline');
const onlineBtn = menu.querySelector('#btn-online');
check('Offline button exists', !!offlineBtn, offlineBtn);
check('Online button exists', !!onlineBtn, onlineBtn);
check('Offline button has onclick handler', typeof offlineBtn?.onclick === 'function', typeof offlineBtn?.onclick);
check('7 menu buttons rendered', menu.querySelectorAll('button').length === 7, menu.querySelectorAll('button').length);

console.log('\n=== Critical styles injected (cache-proof) ===');
const injected = window.document.getElementById('bball-critical-styles');
check('Injected <style> tag present', !!injected, !!injected);
check('Injected styles contain global .hidden rule',
  injected?.textContent.includes('.hidden { display: none !important; }'),
  injected?.textContent.match(/\.hidden[^}]*}/)?.[0]);

console.log('\n=== Click simulation: offline -> mode-selector ===');
offlineBtn.click();
check('After click, mode-selector visible',
  gcs('mode-selector').display !== 'none', gcs('mode-selector').display);
check('After click, main-menu hidden',
  gcs('main-menu').display === 'none', gcs('main-menu').display);
check('halftime-modal STILL hidden after navigation',
  gcs('halftime-modal').display === 'none', gcs('halftime-modal').display);

console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`);
process.exit(fail === 0 ? 0 : 1);
