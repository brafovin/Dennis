import * as THREE from 'three';
import './ui/styles.css';
import { GameManager } from './game/GameManager.js';
import { UIManager } from './ui/UIManager.js';

// ─── Scene Setup ──────────────────────────────────────────────────────────────

const canvas = document.getElementById('game-canvas');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  200,
);
camera.position.set(0, 8, 12);
camera.lookAt(0, 0, 0);

// ─── Managers ─────────────────────────────────────────────────────────────────

const gameManager = new GameManager(scene, camera, renderer);
const uiManager   = new UIManager(gameManager);

// ─── Game Loop ────────────────────────────────────────────────────────────────

const clock = new THREE.Clock();
let lastTime = 0;

function animate(timestamp) {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  // Only render game scene if active
  if (gameManager.state === 'playing') {
    gameManager.update(delta);
  }

  renderer.render(scene, camera);
}

// ─── Resize ───────────────────────────────────────────────────────────────────

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── Hide loading screen after a short delay ──────────────────────────────────

setTimeout(() => {
  const loading = document.getElementById('loading-screen');
  if (loading) loading.classList.add('hidden');
  uiManager.showScreen('main-menu');
}, 800);

// ─── Start ────────────────────────────────────────────────────────────────────

requestAnimationFrame(animate);
