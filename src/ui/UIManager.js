import { i18n } from '../i18n/index.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { GAME_MODES, CONTROL_MODES, JERSEY_COLORS, SKIN_COLORS, PACK_COSTS, PLAYER_POSITIONS } from '../constants.js';

// Inject critical styles directly so they are never affected by CSS caching
function injectCriticalStyles() {
  const existing = document.getElementById('bball-critical-styles');
  if (existing) existing.remove();
  const style = document.createElement('style');
  style.id = 'bball-critical-styles';
  style.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; overflow: hidden; background: #0d1428; color: #fff; }
    #game-canvas { position: fixed; inset: 0; z-index: 0; width: 100%; height: 100%; }
    #ui-overlay  { position: fixed; inset: 0; z-index: 10; pointer-events: none; }
    .ui-screen   {
      position: absolute; inset: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      pointer-events: all !important;
      background: linear-gradient(160deg,#0d1a40 0%,#162060 40%,#1a1050 70%,#0d1428 100%);
    }
    .ui-screen.hidden { display: none !important; }

    /* GLOBAL hide rule — must win over .halftime-screen{display:flex}, .modal-overlay{display:flex} etc.
       This is the critical fix: #halftime-modal/#result-modal are full-screen dark overlays
       (z-index 50/100) that were NOT being hidden, covering the menu and blocking all clicks. */
    .hidden { display: none !important; }

    /* Buttons — all interactive */
    .bb-btn {
      display: block; width: 100%;
      padding: 15px 28px; margin: 0;
      border-radius: 12px; border: 2px solid transparent;
      font-size: 16px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
      cursor: pointer !important; pointer-events: all !important;
      transition: transform .15s, box-shadow .15s;
      user-select: none;
    }
    .bb-btn:hover  { transform: translateY(-2px); }
    .bb-btn:active { transform: scale(0.96); }

    .bb-btn-orange {
      background: linear-gradient(135deg,#ff9a00,#e06800);
      color: #ffffff; border-color: #ffb830;
      box-shadow: 0 4px 20px rgba(255,154,0,.5);
    }
    .bb-btn-orange:hover { box-shadow: 0 6px 28px rgba(255,154,0,.75); }

    .bb-btn-blue {
      background: linear-gradient(135deg,#3366ee,#1144bb);
      color: #ffffff; border-color: #6699ff;
      box-shadow: 0 4px 16px rgba(50,100,230,.4);
    }
    .bb-btn-blue:hover { box-shadow: 0 6px 22px rgba(50,100,230,.65); }

    .bb-btn-ghost {
      background: rgba(255,255,255,0.12);
      color: #e8f0ff; border-color: rgba(150,190,255,.5);
    }
    .bb-btn-ghost:hover { background: rgba(255,255,255,.22); color: #fff; border-color: rgba(200,225,255,.8); }

    .bb-btn-red   { background: linear-gradient(135deg,#ee3355,#bb1133); color:#fff; border-color:#ff6688; }
    .bb-btn-green { background: linear-gradient(135deg,#22cc55,#118833); color:#fff; border-color:#44ee77; }
    .bb-btn-gold  { background: linear-gradient(135deg,#ffd700,#cc9900); color:#111; border-color:#ffe555; }

    /* Menu wrapper */
    .bb-menu-wrap { display:flex; flex-direction:column; align-items:center; width:100%; max-width:360px; gap:11px; }

    /* Title */
    .bb-title {
      font-size: clamp(44px,8vw,90px); font-weight:900; letter-spacing:4px;
      color: #ff9a00; text-shadow: 0 0 30px rgba(255,154,0,.7), 0 2px 6px rgba(0,0,0,.9);
      margin-bottom: 6px; text-align:center;
      animation: bbGlow 3s ease-in-out infinite;
    }
    @keyframes bbGlow {
      0%,100% { color:#ff9a00; text-shadow:0 0 25px rgba(255,154,0,.7); }
      50%      { color:#ffcc00; text-shadow:0 0 50px rgba(255,220,0,.9); }
    }
    .bb-subtitle { color:#aac4ee; font-size:13px; letter-spacing:6px; text-transform:uppercase; margin-bottom:44px; }

    /* Modal */
    .bb-modal {
      background: linear-gradient(145deg,#111e48,#1b2d6a);
      border: 2px solid rgba(100,160,255,.55);
      border-radius: 20px; padding: 36px 40px;
      max-width: 560px; width:90%;
      box-shadow: 0 20px 60px rgba(0,0,0,.75);
      color: #ffffff;
    }
    .bb-modal h2 { font-size:26px; font-weight:900; margin-bottom:20px; }
    .bb-section-title {
      font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:2px;
      color:#ff9a00; margin-bottom:12px; padding-bottom:7px;
      border-bottom:1px solid rgba(120,170,255,.4);
    }

    /* Mode cards */
    .bb-mode-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:20px; }
    .bb-mode-card {
      background: rgba(20,35,85,.9); border:2px solid rgba(100,155,255,.45);
      border-radius:12px; padding:20px 12px; text-align:center; cursor:pointer !important;
      pointer-events:all !important; transition:all .2s; color:#fff;
    }
    .bb-mode-card:hover, .bb-mode-card.selected {
      border-color:#ff9a00; background:rgba(255,154,0,.15);
      transform:translateY(-2px); box-shadow:0 6px 20px rgba(255,154,0,.25);
    }
    .bb-mode-card .icon { font-size:40px; margin-bottom:10px; }
    .bb-mode-card .label { font-size:17px; font-weight:700; }
    .bb-mode-card .desc  { font-size:11px; color:#aac4ee; margin-top:5px; }

    /* Control toggle */
    .bb-ctrl-toggle { display:flex; border-radius:12px; border:2px solid rgba(100,155,255,.45); overflow:hidden; margin-bottom:20px; }
    .bb-ctrl-opt {
      flex:1; padding:14px; text-align:center; cursor:pointer !important;
      pointer-events:all !important; transition:all .2s; color:#aac4ee;
    }
    .bb-ctrl-opt.active { background:linear-gradient(135deg,#ff9a00,#e06800); color:#fff; font-weight:700; }
    .bb-ctrl-opt:not(.active):hover { background:rgba(255,255,255,.08); color:#fff; }
    .bb-ctrl-opt .cicon { font-size:26px; margin-bottom:5px; }
    .bb-ctrl-opt .ctitle { font-size:13px; font-weight:700; text-transform:uppercase; }
    .bb-ctrl-opt .cdesc  { font-size:11px; margin-top:3px; opacity:.8; }

    /* Row buttons inside modals */
    .bb-btn-row { display:flex; gap:12px; justify-content:center; margin-top:20px; }
    .bb-btn-row .bb-btn { width:auto; }

    /* Form inputs */
    .bb-input {
      background:rgba(30,50,110,.85); border:2px solid rgba(100,155,255,.5);
      border-radius:8px; padding:9px 13px; color:#fff; font-size:14px; width:100%; outline:none;
    }
    .bb-input:focus { border-color:#ff9a00; }
    .bb-label { font-size:13px; color:#aac4ee; min-width:110px; flex-shrink:0; }
    .bb-form-row { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
    .bb-color-row { display:flex; gap:8px; flex-wrap:wrap; }
    .bb-swatch {
      width:33px; height:33px; border-radius:7px; cursor:pointer; border:2px solid transparent;
      transition:transform .15s, border-color .15s;
    }
    .bb-swatch:hover { transform:scale(1.18); }
    .bb-swatch.sel   { border-color:#ff9a00 !important; transform:scale(1.18); }

    /* Skills */
    .bb-skill-row { display:flex; align-items:center; gap:10px; margin-bottom:9px; }
    .bb-skill-bar  { flex:1; height:8px; background:rgba(255,255,255,.12); border-radius:4px; overflow:hidden; }
    .bb-skill-fill { height:100%; background:linear-gradient(90deg,#ff9a00,#ffcc00); border-radius:4px; transition:width .15s; }
    .bb-skill-val  { font-size:14px; font-weight:700; color:#ff9a00; width:28px; text-align:right; }
    .bb-skill-btn  {
      width:26px; height:26px; border-radius:6px; border:1px solid rgba(120,170,255,.5);
      background:rgba(255,255,255,.1); color:#fff; font-size:16px; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
    }
    .bb-skill-btn:hover { background:#ff9a00; color:#000; }

    /* HUD */
    .bb-hud-top {
      position:absolute; top:14px; left:50%; transform:translateX(-50%);
      display:flex; background:rgba(10,18,50,.93); border:2px solid rgba(100,155,255,.45);
      border-radius:14px; overflow:hidden; min-width:340px; box-shadow:0 4px 20px rgba(0,0,0,.5);
    }
    .bb-hud-team { flex:1; padding:9px 18px; text-align:center; }
    .bb-hud-team.t0 { background:rgba(220,40,40,.25); }
    .bb-hud-team.t1 { background:rgba(40,40,220,.25); }
    .bb-hud-tname { font-size:10px; color:#aac4ee; text-transform:uppercase; letter-spacing:1px; }
    .bb-hud-score { font-size:38px; font-weight:900; font-variant-numeric:tabular-nums; }
    .t0 .bb-hud-score { color:#ff7777; }
    .t1 .bb-hud-score { color:#7799ff; }
    .bb-hud-center { padding:8px 18px; text-align:center; border-left:1px solid rgba(100,155,255,.35); border-right:1px solid rgba(100,155,255,.35); min-width:95px; }
    .bb-hud-q { font-size:11px; color:#aac4ee; text-transform:uppercase; }
    .bb-hud-timer { font-size:26px; font-weight:700; color:#ff9a00; font-variant-numeric:tabular-nums; }

    /* Pack cards */
    .bb-pack-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; margin:18px 0; }
    .bb-pack-card {
      background:rgba(18,30,75,.95); border:2px solid rgba(100,155,255,.4);
      border-radius:12px; padding:18px 14px; cursor:pointer !important;
      pointer-events:all !important; transition:all .2s; text-align:center; color:#fff;
    }
    .bb-pack-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,.4); }

    /* Player card */
    .bb-player-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:14px; margin:16px 0; max-height:380px; overflow-y:auto; }
    .bb-pcard {
      background:rgba(18,30,75,.95); border:2px solid rgba(100,155,255,.4);
      border-radius:12px; padding:16px; cursor:pointer !important;
      pointer-events:all !important; transition:all .2s; text-align:center; color:#fff;
    }
    .bb-pcard:hover, .bb-pcard.sel { border-color:#ff9a00; background:rgba(255,154,0,.1); }

    /* Coin display */
    .bb-coins {
      display:inline-flex; align-items:center; gap:8px;
      background:rgba(255,200,0,.12); border:1px solid rgba(255,200,0,.35);
      border-radius:24px; padding:6px 18px; font-size:16px; font-weight:700; color:#ff9a00;
    }

    /* Spin wheel */
    .bb-wheel-wrap { position:relative; width:280px; height:280px; margin:0 auto 20px; }
    .bb-wheel-ptr  { position:absolute; top:-14px; left:50%; transform:translateX(-50%); font-size:32px; }

    /* Event popup */
    .bb-popup {
      position:absolute; top:45%; left:50%; transform:translate(-50%,-50%);
      font-size:34px; font-weight:900; text-transform:uppercase; letter-spacing:4px;
      pointer-events:none; animation:bbPop 1.6s forwards; z-index:50;
    }
    @keyframes bbPop {
      0%   { opacity:0; transform:translate(-50%,-50%) scale(.5); }
      20%  { opacity:1; transform:translate(-50%,-80%) scale(1.2); }
      70%  { opacity:1; transform:translate(-50%,-100%) scale(1); }
      100% { opacity:0; transform:translate(-50%,-115%) scale(.9); }
    }

    /* Loading */
    .bb-spinner { width:56px; height:56px; border:4px solid rgba(255,255,255,.1); border-top-color:#ff9a00; border-radius:50%; animation:bbSpin .8s linear infinite; margin:20px auto; }
    @keyframes bbSpin { to { transform:rotate(360deg); } }

    /* Settings */
    .bb-lang-btn {
      background:rgba(255,255,255,.1); border:2px solid transparent; border-radius:8px;
      padding:6px 10px; cursor:pointer; font-size:20px; transition:all .15s; color:#fff;
    }
    .bb-lang-btn:hover  { background:rgba(255,255,255,.2); }
    .bb-lang-btn.active { border-color:#ff9a00; }

    .bb-slider { -webkit-appearance:none; appearance:none; width:130px; height:6px; background:rgba(255,255,255,.2); border-radius:3px; outline:none; }
    .bb-slider::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:#ff9a00; cursor:pointer; }

    /* Shot clock */
    .bb-shotclock {
      position:absolute; top:88px; left:50%; transform:translateX(-50%);
      background:rgba(200,50,50,.88); border-radius:8px; padding:5px 18px;
      font-size:20px; font-weight:700; color:#fff; border:1px solid rgba(255,100,100,.5);
    }
    .bb-shotclock.urgent { background:rgba(220,20,20,.96); animation:bbUrgent .5s infinite; }
    @keyframes bbUrgent { 0%,100%{transform:translateX(-50%) scale(1)} 50%{transform:translateX(-50%) scale(1.06)} }

    .bb-poss-bar {
      position:absolute; top:88px; left:14px;
      background:rgba(10,18,50,.88); border:1px solid rgba(100,155,255,.4);
      border-radius:8px; padding:7px 14px; font-size:12px; color:#aac4ee;
      display:flex; align-items:center; gap:8px;
    }
    .bb-poss-dot { width:10px; height:10px; border-radius:50%; }

    .bb-ctrl-hint {
      position:absolute; bottom:16px; right:16px;
      background:rgba(0,0,0,.65); border:1px solid rgba(100,155,255,.3);
      border-radius:12px; padding:12px 16px; font-size:12px; color:#aac4ee;
      pointer-events:none;
    }
    .bb-ctrl-hint h4 { font-size:10px; text-transform:uppercase; letter-spacing:2px; color:#ff9a00; margin-bottom:8px; }
    .bb-ctrl-line { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
    .bb-key { background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.2); border-radius:4px; padding:2px 6px; font-size:11px; font-family:monospace; min-width:28px; text-align:center; color:#fff; }

    .bb-charge {
      position:absolute; bottom:110px; left:50%; transform:translateX(-50%);
      width:200px; text-align:center; pointer-events:none;
    }
    .bb-charge-label { font-size:11px; text-transform:uppercase; letter-spacing:2px; color:#ff9a00; margin-bottom:5px; }
    .bb-charge-bar   { height:12px; background:rgba(255,255,255,.1); border-radius:6px; border:1px solid rgba(100,155,255,.4); overflow:hidden; }
    .bb-charge-fill  { height:100%; background:linear-gradient(90deg,#22cc55,#ffcc00,#ee3355); border-radius:6px; transition:width .05s linear; }

    ::-webkit-scrollbar { width:5px; }
    ::-webkit-scrollbar-thumb { background:rgba(255,255,255,.2); border-radius:3px; }

    @media(max-width:680px){
      .bb-mode-grid { grid-template-columns:1fr; }
      .bb-pack-grid { grid-template-columns:1fr 1fr; }
    }
  `;
  document.head.appendChild(style);
}

export class UIManager {
  constructor(gameManager) {
    this.gm = gameManager;
    this.currentScreen = 'main-menu';
    this.pendingGameConfig = {};
    injectCriticalStyles();
    this._initDOM();
    this._bindGameEvents();
    document.addEventListener('languageChanged', () => { injectCriticalStyles(); this._refreshAll(); });
    this.showScreen('main-menu');
  }

  _initDOM() {
    this._buildMainMenu();
    this._buildModeSelector();
    this._buildPlayerCreator();
    this._buildMyPlayers();
    this._buildPackStore();
    this._buildSpinWheel();
    this._buildSettings();
    this._buildHUD();
    this._buildResultModal();
    this._buildHalftimeModal();
    this._buildLoadingScreen();
  }

  // ───────────────────────────────────────────
  // MAIN MENU
  // ───────────────────────────────────────────
  _buildMainMenu() {
    const el = document.getElementById('main-menu');
    el.innerHTML = `
      <div id="bg-balls" style="position:absolute;inset:0;overflow:hidden;pointer-events:none"></div>

      <div class="bb-title">${i18n.t('title')}</div>
      <div class="bb-subtitle">STREET BASKETBALL 3D</div>

      <div class="bb-menu-wrap">
        <button class="bb-btn bb-btn-orange" id="btn-offline">${i18n.t('play_offline')}</button>
        <button class="bb-btn bb-btn-blue"   id="btn-online">${i18n.t('play_online')}</button>
        <button class="bb-btn bb-btn-ghost"  id="btn-create-player">${i18n.t('create_player')}</button>
        <button class="bb-btn bb-btn-ghost"  id="btn-my-players">${i18n.t('my_players')}</button>
        <button class="bb-btn bb-btn-ghost"  id="btn-packs">${i18n.t('pack_store')}</button>
        <button class="bb-btn bb-btn-ghost"  id="btn-spin">${i18n.t('spin_wheel')}</button>
        <button class="bb-btn bb-btn-ghost"  id="btn-settings">${i18n.t('settings')}</button>
      </div>
    `;

    el.querySelector('#btn-offline').onclick = () => this.showScreen('mode-selector');
    el.querySelector('#btn-online').onclick = () => this._showOnlineMenu();
    el.querySelector('#btn-create-player').onclick = () => this.showScreen('player-creator');
    el.querySelector('#btn-my-players').onclick = () => this.showScreen('my-players');
    el.querySelector('#btn-packs').onclick = () => this.showScreen('pack-store');
    el.querySelector('#btn-spin').onclick = () => this.showScreen('spin-wheel');
    el.querySelector('#btn-settings').onclick = () => this.showScreen('settings');

    this._spawnBgBalls();
  }

  _spawnBgBalls() {
    const container = document.getElementById('bg-balls');
    if (!container) return;
    for (let i = 0; i < 8; i++) {
      const ball = document.createElement('div');
      ball.className = 'floating-ball';
      const size = 40 + Math.random() * 80;
      ball.style.cssText = `
        width: ${size}px; height: ${size}px;
        left: ${Math.random() * 100}%;
        animation-duration: ${8 + Math.random() * 12}s;
        animation-delay: ${-Math.random() * 15}s;
      `;
      container.appendChild(ball);
    }
  }

  // ───────────────────────────────────────────
  // MODE SELECTOR
  // ───────────────────────────────────────────
  _buildModeSelector() {
    const el = document.getElementById('mode-selector');
    if (!el) {
      const div = document.createElement('div');
      div.id = 'mode-selector';
      div.className = 'ui-screen hidden';
      document.getElementById('ui-overlay').appendChild(div);
    }
    this._renderModeSelector();
  }

  _renderModeSelector() {
    const el = document.getElementById('mode-selector');
    if (!el) return;
    const settings = SaveSystem.getSettings();
    const controlMode = settings.controlMode || 'auto';

    el.innerHTML = `
      <div class="bb-modal" style="max-width:640px;width:90%">
        <h2>${i18n.t('select_mode')}</h2>

        <div class="bb-mode-grid" id="mode-grid">
          ${[
            { id: '1v1', icon: '🏀', label: i18n.t('mode_1v1'), desc: '1 vs 1 – Mano a mano' },
            { id: '2v2', icon: '⛹️', label: i18n.t('mode_2v2'), desc: '2 vs 2 – Team play' },
            { id: '3v3', icon: '🏆', label: i18n.t('mode_3v3'), desc: '3 vs 3 – Street ball' },
          ].map(m => `
            <div class="bb-mode-card ${this.pendingGameConfig.mode === m.id ? 'selected' : ''}" data-mode="${m.id}">
              <div class="icon">${m.icon}</div>
              <div class="label">${m.label}</div>
              <div class="desc">${m.desc}</div>
            </div>
          `).join('')}
        </div>

        <div class="bb-section-title">${i18n.t('control_mode')}</div>
        <div class="bb-ctrl-toggle">
          <div class="bb-ctrl-opt ${controlMode === 'auto' ? 'active' : ''}" data-ctrl="auto">
            <div class="cicon">🎮</div>
            <div class="ctitle">${i18n.t('auto_mode')}</div>
            <div class="cdesc">${i18n.t('auto_desc')}</div>
          </div>
          <div class="bb-ctrl-opt ${controlMode === 'manual' ? 'active' : ''}" data-ctrl="manual">
            <div class="cicon">🕹️</div>
            <div class="ctitle">${i18n.t('manual_mode')}</div>
            <div class="cdesc">${i18n.t('manual_desc')}</div>
          </div>
        </div>

        <div class="bb-btn-row">
          <button class="bb-btn bb-btn-ghost" id="btn-back-mode">${i18n.t('back')}</button>
          <button class="bb-btn bb-btn-orange" style="padding:16px 36px;font-size:18px" id="btn-start-game">${i18n.t('start_game')}</button>
        </div>
      </div>
    `;

    el.querySelectorAll('.bb-mode-card').forEach(card => {
      card.onclick = () => {
        el.querySelectorAll('.bb-mode-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.pendingGameConfig.mode = card.dataset.mode;
      };
    });

    el.querySelectorAll('.bb-ctrl-opt').forEach(opt => {
      opt.onclick = () => {
        el.querySelectorAll('.bb-ctrl-opt').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        this.pendingGameConfig.controlMode = opt.dataset.ctrl;
        const s = SaveSystem.getSettings();
        s.controlMode = opt.dataset.ctrl;
        SaveSystem.saveSettings(s);
      };
    });

    el.querySelector('#btn-back-mode').onclick = () => this.showScreen('main-menu');
    el.querySelector('#btn-start-game').onclick = () => this._launchGame();

    // Default selection
    if (!this.pendingGameConfig.mode) {
      this.pendingGameConfig.mode = '1v1';
      el.querySelector('[data-mode="1v1"]')?.classList.add('selected');
    }
    if (!this.pendingGameConfig.controlMode) {
      this.pendingGameConfig.controlMode = controlMode;
    }
  }

  _launchGame() {
    const activePlayer = SaveSystem.getActivePlayer();
    const settings = SaveSystem.getSettings();
    const config = {
      mode: this.pendingGameConfig.mode || '1v1',
      controlMode: this.pendingGameConfig.controlMode || settings.controlMode || 'auto',
      playerConfig: activePlayer || {},
    };

    this.showScreen('hud');
    this.gm?.startGame(config);
  }

  // ───────────────────────────────────────────
  // PLAYER CREATOR
  // ───────────────────────────────────────────
  _buildPlayerCreator() {
    const el = document.getElementById('player-creator');
    if (!el) return;

    this._playerDraft = {
      name: 'Spieler', number: 23, position: 'PG',
      skinColor: SKIN_COLORS[1], jerseyColor: JERSEY_COLORS[0],
      shortsColor: JERSEY_COLORS[1], shoeColor: '#111111',
      skills: { speed: 75, shooting: 75, dribbling: 75, passing: 75, defense: 75 },
      skillPoints: 10,
    };

    this._renderCreator();
  }

  _renderCreator() {
    const el = document.getElementById('player-creator');
    if (!el) return;
    const d = this._playerDraft;

    el.innerHTML = `
      <div style="width:100%;max-width:920px;margin:0 auto">
        <h2 style="font-size:28px;font-weight:900;text-align:center;margin-bottom:20px">${i18n.t('create_player_title')}</h2>
        <div class="creator-layout">
          <div class="creator-preview">
            <canvas id="player-preview-canvas" width="220" height="320"></canvas>
            <div class="preview-name">${d.name}</div>
            <div class="preview-number">#${d.number}</div>
            <div style="font-size:14px;color:#aabbcc">${i18n.t(d.position)} • ${d.position}</div>
          </div>

          <div class="creator-form">
            <!-- Identity -->
            <div class="form-section">
              <div class="form-section-title">${i18n.t('player_name')}</div>
              <div class="form-row">
                <label>${i18n.t('player_name')}</label>
                <input type="text" id="pc-name" value="${d.name}" maxlength="18" placeholder="Dein Name">
              </div>
              <div class="form-row">
                <label>${i18n.t('jersey_number')}</label>
                <input type="number" id="pc-number" value="${d.number}" min="1" max="99" style="max-width:80px">
              </div>
              <div class="form-row">
                <label>${i18n.t('position')}</label>
                <select id="pc-position">
                  ${PLAYER_POSITIONS.map(p => `<option value="${p}" ${d.position === p ? 'selected' : ''}>${i18n.t(p)} (${p})</option>`).join('')}
                </select>
              </div>
            </div>

            <!-- Colors -->
            <div class="form-section">
              <div class="form-section-title">${i18n.t('skin_color')}</div>
              <div class="color-picker-row" id="cp-skin">
                ${SKIN_COLORS.map(c => `<div class="color-swatch ${d.skinColor === c ? 'selected' : ''}" style="background:${c}" data-color="${c}"></div>`).join('')}
              </div>
            </div>

            <div class="form-section">
              <div class="form-section-title">${i18n.t('jersey_color')}</div>
              <div class="color-picker-row" id="cp-jersey">
                ${JERSEY_COLORS.map(c => `<div class="color-swatch ${d.jerseyColor === c ? 'selected' : ''}" style="background:${c};border:2px solid ${c === '#FFFFFF' ? '#888' : c}" data-color="${c}"></div>`).join('')}
              </div>
            </div>

            <div class="form-section">
              <div class="form-section-title">${i18n.t('shorts_color')}</div>
              <div class="color-picker-row" id="cp-shorts">
                ${JERSEY_COLORS.map(c => `<div class="color-swatch ${d.shortsColor === c ? 'selected' : ''}" style="background:${c};border:2px solid ${c === '#FFFFFF' ? '#888' : c}" data-color="${c}"></div>`).join('')}
              </div>
            </div>

            <!-- Skills -->
            <div class="form-section">
              <div class="form-section-title">${i18n.t('skills')}</div>
              <div class="skill-points-display">${i18n.t('skill_points_left')}: <span id="pc-pts">${d.skillPoints}</span></div>
              ${Object.entries(d.skills).map(([key, val]) => `
                <div class="skill-row">
                  <div class="skill-name">${i18n.t(key)}</div>
                  <div class="skill-buttons">
                    <button class="skill-btn" data-skill="${key}" data-dir="-1">−</button>
                  </div>
                  <div class="skill-bar-container">
                    <div class="skill-bar-fill" id="sb-${key}" style="width:${val}%"></div>
                  </div>
                  <div class="skill-value" id="sv-${key}">${val}</div>
                  <div class="skill-buttons">
                    <button class="skill-btn" data-skill="${key}" data-dir="1">+</button>
                  </div>
                </div>
              `).join('')}
            </div>

            <div style="display:flex;gap:12px;justify-content:center;margin-top:8px">
              <button class="btn btn-ghost" id="btn-back-creator">${i18n.t('back')}</button>
              <button class="btn btn-primary" id="btn-save-player">${i18n.t('save_player')}</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind inputs
    el.querySelector('#pc-name').oninput = e => {
      d.name = e.target.value;
      el.querySelector('.preview-name').textContent = d.name;
      this._drawPreview();
    };
    el.querySelector('#pc-number').oninput = e => {
      d.number = parseInt(e.target.value) || 1;
      el.querySelector('.preview-number').textContent = '#' + d.number;
      this._drawPreview();
    };
    el.querySelector('#pc-position').onchange = e => {
      d.position = e.target.value;
      el.querySelector('div[style*="aabbcc"]').textContent = `${i18n.t(d.position)} • ${d.position}`;
    };

    // Color pickers
    this._bindColorPicker(el, '#cp-skin', 'skinColor');
    this._bindColorPicker(el, '#cp-jersey', 'jerseyColor');
    this._bindColorPicker(el, '#cp-shorts', 'shortsColor');

    // Skills
    el.querySelectorAll('.skill-btn').forEach(btn => {
      btn.onclick = () => {
        const skill = btn.dataset.skill;
        const dir = parseInt(btn.dataset.dir);
        const current = d.skills[skill];
        if (dir > 0 && d.skillPoints > 0 && current < 99) {
          d.skills[skill]++;
          d.skillPoints--;
        } else if (dir < 0 && current > 50) {
          d.skills[skill]--;
          d.skillPoints++;
        }
        el.querySelector(`#sb-${skill}`).style.width = d.skills[skill] + '%';
        el.querySelector(`#sv-${skill}`).textContent = d.skills[skill];
        el.querySelector('#pc-pts').textContent = d.skillPoints;
        this._drawPreview();
      };
    });

    el.querySelector('#btn-back-creator').onclick = () => this.showScreen('main-menu');
    el.querySelector('#btn-save-player').onclick = () => this._savePlayer();

    this._drawPreview();
  }

  _bindColorPicker(el, selector, prop) {
    const d = this._playerDraft;
    el.querySelectorAll(`${selector} .color-swatch`).forEach(sw => {
      sw.onclick = () => {
        el.querySelectorAll(`${selector} .color-swatch`).forEach(s => s.classList.remove('selected'));
        sw.classList.add('selected');
        d[prop] = sw.dataset.color;
        this._drawPreview();
      };
    });
  }

  _drawPreview() {
    const canvas = document.getElementById('player-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const d = this._playerDraft;

    ctx.clearRect(0, 0, W, H);

    // Background
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#1a2040');
    grad.addColorStop(1, '#2a3060');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Court floor
    ctx.fillStyle = '#c8903a';
    ctx.fillRect(0, H * 0.8, W, H * 0.2);

    // Draw player
    const cx = W / 2;
    const base = H * 0.78;
    const scale = 1.4;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(cx, base + 2, 28 * scale, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shoes
    ctx.fillStyle = d.shoeColor || '#111';
    ctx.fillRect(cx - 22 * scale, base - 8 * scale, 18 * scale, 8 * scale);
    ctx.fillRect(cx + 4 * scale, base - 8 * scale, 18 * scale, 8 * scale);

    // Lower legs
    ctx.fillStyle = d.shortsColor;
    ctx.fillRect(cx - 21 * scale, base - 24 * scale, 14 * scale, 16 * scale);
    ctx.fillRect(cx + 7 * scale, base - 24 * scale, 14 * scale, 16 * scale);

    // Shorts/Upper legs
    ctx.fillStyle = d.shortsColor;
    ctx.fillRect(cx - 22 * scale, base - 42 * scale, 16 * scale, 18 * scale);
    ctx.fillRect(cx + 6 * scale, base - 42 * scale, 16 * scale, 18 * scale);

    // Jersey
    ctx.fillStyle = d.jerseyColor;
    ctx.beginPath();
    ctx.roundRect?.(cx - 18 * scale, base - 72 * scale, 36 * scale, 30 * scale, 4) ||
    ctx.rect(cx - 18 * scale, base - 72 * scale, 36 * scale, 30 * scale);
    ctx.fill();

    // Jersey number
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${14 * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(d.number), cx, base - 57 * scale);

    // Arms
    ctx.fillStyle = d.skinColor;
    ctx.fillRect(cx - 32 * scale, base - 70 * scale, 12 * scale, 28 * scale);
    ctx.fillRect(cx + 20 * scale, base - 70 * scale, 12 * scale, 28 * scale);

    // Head
    ctx.fillStyle = d.skinColor;
    ctx.beginPath();
    ctx.arc(cx, base - 84 * scale, 14 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(cx - 5 * scale, base - 85 * scale, 2 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 5 * scale, base - 85 * scale, 2 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Name tag
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(cx - 55, 12, 110, 26);
    ctx.fillStyle = '#e8a020';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.name.toUpperCase(), cx, 25);
  }

  _savePlayer() {
    const d = this._playerDraft;
    const player = SaveSystem.addPlayer({ ...d });
    SaveSystem.setActivePlayer(player.id);

    this._showToast(`${d.name} gespeichert! ✓`);
    setTimeout(() => this.showScreen('main-menu'), 800);
  }

  // ───────────────────────────────────────────
  // MY PLAYERS
  // ───────────────────────────────────────────
  _buildMyPlayers() {
    const el = document.getElementById('my-players');
    if (!el) return;
  }

  _renderMyPlayers() {
    const el = document.getElementById('my-players');
    if (!el) return;
    const players = SaveSystem.getPlayers();
    const activeId = SaveSystem.load(SaveSystem.KEYS.ACTIVE_PLAYER);

    el.innerHTML = `
      <div class="bb-modal" style="max-width:600px;width:90%;text-align:center">
        <h2>${i18n.t('my_players')}</h2>
        ${players.length === 0 ? `
          <p style="color:#aac4ee;text-align:center;padding:40px 0">
            Noch keine Spieler erstellt.<br><span style="font-size:52px">🏀</span>
          </p>
        ` : `
          <div class="bb-player-grid">
            ${players.map(p => `
              <div class="bb-pcard ${p.id === activeId ? 'sel' : ''}" data-id="${p.id}">
                <div style="font-size:46px;font-weight:900;color:${p.jerseyColor || '#ff9a00'}">#${p.number}</div>
                <div style="font-size:14px;font-weight:700">${p.name}</div>
                <div style="font-size:12px;color:#aac4ee">${i18n.t(p.position) || p.position}</div>
                ${p.id === activeId ? '<div style="font-size:11px;color:#ff9a00;margin-top:5px;letter-spacing:1px">✓ AKTIV</div>' : ''}
              </div>
            `).join('')}
          </div>
        `}
        <div class="bb-btn-row">
          <button class="bb-btn bb-btn-ghost" id="btn-back-players">${i18n.t('back')}</button>
          <button class="bb-btn bb-btn-orange" id="btn-new-player">${i18n.t('create_player')}</button>
        </div>
      </div>
    `;

    el.querySelectorAll('.bb-pcard').forEach(card => {
      card.onclick = () => {
        SaveSystem.setActivePlayer(card.dataset.id);
        this._renderMyPlayers();
      };
    });

    el.querySelector('#btn-back-players').onclick = () => this.showScreen('main-menu');
    el.querySelector('#btn-new-player').onclick = () => this.showScreen('player-creator');
  }

  // ───────────────────────────────────────────
  // PACK STORE
  // ───────────────────────────────────────────
  _buildPackStore() {
    const el = document.getElementById('pack-store');
    if (!el) return;
  }

  _renderPackStore() {
    const el = document.getElementById('pack-store');
    if (!el) return;
    const coins = SaveSystem.getCoins();

    const packs = [
      { id: 'bronze', borderColor: '#cd7f32', icon: '🥉', name: i18n.t('bronze_pack'),   cost: PACK_COSTS.BRONZE,   odds: '3× Common, 1× Uncommon' },
      { id: 'silver', borderColor: '#c0c0c0', icon: '🥈', name: i18n.t('silver_pack'),   cost: PACK_COSTS.SILVER,   odds: '2× Uncommon, 1× Rare' },
      { id: 'gold',   borderColor: '#ffd700', icon: '🥇', name: i18n.t('gold_pack'),     cost: PACK_COSTS.GOLD,     odds: '1× Rare, 1× Epic' },
      { id: 'plat',   borderColor: '#e5e4e2', icon: '💎', name: i18n.t('platinum_pack'), cost: PACK_COSTS.PLATINUM, odds: '1× Legendary' },
    ];

    el.innerHTML = `
      <div class="bb-modal" style="max-width:560px;width:90%;text-align:center">
        <h2>${i18n.t('packs_title')}</h2>
        <div class="bb-coins" style="margin:0 auto 20px">🪙 <span id="pack-coins">${coins}</span> ${i18n.t('your_coins')}</div>

        <div class="bb-pack-grid">
          ${packs.map(p => `
            <div class="bb-pack-card" data-pack="${p.id}" data-cost="${p.cost}"
                 style="border-color:${p.borderColor}">
              <div style="font-size:44px;margin-bottom:8px">${p.icon}</div>
              <div style="font-size:15px;font-weight:700;margin-bottom:4px">${p.name}</div>
              <div style="font-size:14px;color:#ff9a00;font-weight:700">🪙 ${p.cost}</div>
              <div style="font-size:11px;color:#aac4ee;margin-top:5px">${p.odds}</div>
            </div>
          `).join('')}
        </div>

        <div class="bb-btn-row">
          <button class="bb-btn bb-btn-ghost" id="btn-back-packs">${i18n.t('back')}</button>
        </div>
      </div>
    `;

    el.querySelectorAll('.bb-pack-card').forEach(card => {
      card.onclick = () => {
        const cost = parseInt(card.dataset.cost);
        if (!SaveSystem.spendCoins(cost)) {
          this._showToast(i18n.t('not_enough_coins') + ' 🪙');
          return;
        }
        el.querySelector('#pack-coins').textContent = SaveSystem.getCoins();
        this._openPack(card.dataset.pack);
      };
    });

    el.querySelector('#btn-back-packs').onclick = () => this.showScreen('main-menu');
  }

  _openPack(packType) {
    const items = this._generatePackItems(packType);
    items.forEach(item => SaveSystem.addToInventory(item));
    this._showPackReveal(items);
  }

  _generatePackItems(type) {
    const pool = {
      bronze:   [['common',3], ['uncommon',1]],
      silver:   [['uncommon',2], ['rare',1]],
      gold:     [['rare',1], ['epic',1]],
      plat:     [['legendary',1], ['epic',1]],
    };
    const rarityItems = {
      common:    ['⚡+1 Speed', '🎯+1 Shooting', '🏀+1 Dribbling', '🛡️+1 Defense'],
      uncommon:  ['⚡+2 Speed', '🎯+2 Shooting', '👟 Neues Schuhdesign', '🎽 Jersey Skin'],
      rare:      ['⚡+3 Speed', '🎯+3 Shooting', '✨ Special Move', '💫 New Animation'],
      epic:      ['🌟 Dunk Pack', '🔥 Signature Shot', '👑 VIP Jersey'],
      legendary: ['💎 Legendary Skill', '🏆 Championship Pack', '⭐ All-Star Bundle'],
    };
    const result = [];
    (pool[type] || []).forEach(([rarity, count]) => {
      const arr = rarityItems[rarity];
      for (let i = 0; i < count; i++) {
        const name = arr[Math.floor(Math.random() * arr.length)];
        result.push({ type: 'item', rarity, name });
      }
    });
    return result;
  }

  _showPackReveal(items) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-box" style="max-width:500px;width:90%;text-align:center">
        <h2 style="font-size:28px;font-weight:900;margin-bottom:8px">Pack geöffnet! 🎉</h2>
        <div class="pack-items-reveal">
          ${items.map((item, i) => `
            <div class="pack-item ${item.rarity}" style="animation-delay:${i * 0.15}s">
              <div class="pack-item-icon">${item.name.split(' ')[0]}</div>
              <div class="pack-item-name">${item.name.split(' ').slice(1).join(' ')}</div>
              <div class="pack-item-rarity">${item.rarity.toUpperCase()}</div>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-primary btn-full" style="margin-top:20px" id="close-reveal">Schließen</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#close-reveal').onclick = () => {
      document.body.removeChild(modal);
    };
  }

  // ───────────────────────────────────────────
  // SPIN WHEEL
  // ───────────────────────────────────────────
  _buildSpinWheel() {}

  _renderSpinWheel() {
    const el = document.getElementById('spin-wheel');
    if (!el) return;
    const canSpin = SaveSystem.canDailySpin();
    const coins = SaveSystem.getCoins();

    const segments = [
      { label: '🪙 10', color: '#e8a020', value: { type: 'coins', amount: 10 } },
      { label: '🥉 Pack', color: '#cd7f32', value: { type: 'pack', rarity: 'bronze' } },
      { label: '🪙 5', color: '#2244aa', value: { type: 'coins', amount: 5 } },
      { label: '😢 Nichts', color: '#444', value: null },
      { label: '🪙 25', color: '#c09000', value: { type: 'coins', amount: 25 } },
      { label: '⚡+2', color: '#aa44ff', value: { type: 'boost', skill: 'speed', amount: 2 } },
      { label: '🪙 15', color: '#117700', value: { type: 'coins', amount: 15 } },
      { label: '🥈 Pack', color: '#888', value: { type: 'pack', rarity: 'silver' } },
    ];

    el.innerHTML = `
      <div class="bb-modal" style="max-width:460px;width:90%;text-align:center">
        <h2>${i18n.t('spin_title')}</h2>
        <div class="bb-coins" style="margin:8px auto 20px">🪙 ${coins} Münzen</div>
        <div class="bb-wheel-wrap">
          <div class="bb-wheel-ptr">▼</div>
          <canvas id="wheel-canvas" width="280" height="280" style="border-radius:50%;box-shadow:0 0 40px rgba(255,154,0,.35)"></canvas>
        </div>
        ${canSpin ? `
          <button class="bb-btn bb-btn-orange" style="margin-top:20px;max-width:200px;margin-left:auto;margin-right:auto;font-size:18px;padding:16px 36px" id="btn-spin-now">${i18n.t('spin')}</button>
        ` : `
          <div style="color:#aac4ee;margin-top:20px;font-size:14px;line-height:1.7">
            Du hast heute bereits gedreht.<br>Komm morgen wieder! 🔒
          </div>
        `}
        <div class="bb-btn-row"><button class="bb-btn bb-btn-ghost" id="btn-back-spin">${i18n.t('back')}</button></div>
      </div>
    `;

    this._drawWheel(document.getElementById('wheel-canvas'), segments, 0);

    if (canSpin) {
      let spinning = false;
      el.querySelector('#btn-spin-now').onclick = () => {
        if (spinning) return;
        spinning = true;
        SaveSystem.recordDailySpin();
        const winIndex = Math.floor(Math.random() * segments.length);
        this._spinWheel(document.getElementById('wheel-canvas'), segments, winIndex, () => {
          const prize = segments[winIndex].value;
          this._awardSpinPrize(prize, segments[winIndex].label);
          spinning = false;
        });
      };
    }

    el.querySelector('#btn-back-spin').onclick = () => this.showScreen('main-menu');
  }

  _drawWheel(canvas, segments, rotation) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const R = canvas.width / 2;
    const arc = (Math.PI * 2) / segments.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    segments.forEach((seg, i) => {
      const start = rotation + i * arc - Math.PI / 2;
      const end = start + arc;

      ctx.beginPath();
      ctx.moveTo(R, R);
      ctx.arc(R, R, R - 2, start, end);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(R, R);
      ctx.rotate(start + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px Arial';
      ctx.fillText(seg.label, R - 14, 5);
      ctx.restore();
    });

    // Center
    ctx.beginPath();
    ctx.arc(R, R, 22, 0, Math.PI * 2);
    ctx.fillStyle = '#111';
    ctx.fill();
    ctx.strokeStyle = var_primary_color();
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏀', R, R);

    function var_primary_color() { return '#e8a020'; }
  }

  _spinWheel(canvas, segments, winIndex, onDone) {
    const arc = (Math.PI * 2) / segments.length;
    const totalRotation = Math.PI * 2 * (5 + Math.random() * 3) + (segments.length - winIndex - 0.5) * arc;
    const duration = 4000;
    let start = null;

    const animate = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const rot = totalRotation * ease;

      this._drawWheel(canvas, segments, rot);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        onDone();
      }
    };

    requestAnimationFrame(animate);
  }

  _awardSpinPrize(prize, label) {
    if (!prize) {
      this._showToast('Kein Gewinn 😢');
      return;
    }
    if (prize.type === 'coins') {
      SaveSystem.addCoins(prize.amount);
      this._showToast(`${i18n.t('you_won')}: 🪙 ${prize.amount}`);
    } else if (prize.type === 'pack') {
      SaveSystem.addToInventory({ type: 'pack', rarity: prize.rarity });
      this._showToast(`${i18n.t('you_won')}: ${label}`);
    } else if (prize.type === 'boost') {
      this._showToast(`${i18n.t('you_won')}: ${label}`);
    }
  }

  // ───────────────────────────────────────────
  // SETTINGS
  // ───────────────────────────────────────────
  _buildSettings() {}

  _renderSettings() {
    const el = document.getElementById('settings');
    if (!el) return;
    const settings = SaveSystem.getSettings();

    const srow = (label, control) => `
      <div style="display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid rgba(120,170,255,.25)">
        <div style="flex:1;font-size:15px;color:#e0eeff">${label}</div>
        <div>${control}</div>
      </div>`;

    el.innerHTML = `
      <div class="bb-modal" style="max-width:500px;width:90%;text-align:left">
        <h2 style="text-align:center;margin-bottom:20px">${i18n.t('settings_title')}</h2>

        ${srow(i18n.t('language'), `
          <div style="display:flex;gap:7px;flex-wrap:wrap">
            ${i18n.languages.map(l => `
              <button class="bb-lang-btn ${i18n.currentLang === l.code ? 'active' : ''}" data-lang="${l.code}" title="${l.name}">${l.flag}</button>
            `).join('')}
          </div>
        `)}

        ${srow(i18n.t('control_mode'), `
          <div class="bb-ctrl-toggle" style="max-width:220px;margin:0">
            <div class="bb-ctrl-opt ${settings.controlMode === 'auto' ? 'active' : ''}" data-ctrl="auto" style="padding:8px 14px;font-size:12px">${i18n.t('auto_mode')}</div>
            <div class="bb-ctrl-opt ${settings.controlMode === 'manual' ? 'active' : ''}" data-ctrl="manual" style="padding:8px 14px;font-size:12px">${i18n.t('manual_mode')}</div>
          </div>
        `)}

        ${srow(i18n.t('sound'), `<input type="range" class="bb-slider" id="vol-sound" min="0" max="100" value="${(settings.soundVolume||0.8)*100}">`)}
        ${srow(i18n.t('music'), `<input type="range" class="bb-slider" id="vol-music" min="0" max="100" value="${(settings.musicVolume||0.5)*100}">`)}

        ${srow(i18n.t('graphics'), `
          <select id="select-graphics" class="bb-input" style="width:auto;padding:7px 12px">
            <option value="low" ${settings.graphics==='low'?'selected':''}>${i18n.t('low')}</option>
            <option value="medium" ${settings.graphics==='medium'?'selected':''}>${i18n.t('medium')}</option>
            <option value="high" ${settings.graphics==='high'?'selected':''}>${i18n.t('high')}</option>
          </select>
        `)}

        <div class="bb-btn-row" style="margin-top:24px">
          <button class="bb-btn bb-btn-ghost" id="btn-back-settings">${i18n.t('back')}</button>
          <button class="bb-btn bb-btn-orange" id="btn-save-settings">${i18n.t('apply')}</button>
        </div>
      </div>
    `;

    el.querySelectorAll('.bb-lang-btn').forEach(btn => {
      btn.onclick = () => {
        i18n.setLanguage(btn.dataset.lang);
        this._renderSettings();
      };
    });

    el.querySelectorAll('.bb-ctrl-opt').forEach(opt => {
      opt.onclick = () => {
        el.querySelectorAll('.bb-ctrl-opt').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        settings.controlMode = opt.dataset.ctrl;
      };
    });

    el.querySelector('#btn-back-settings').onclick = () => this.showScreen('main-menu');
    el.querySelector('#btn-save-settings').onclick = () => {
      settings.soundVolume = parseInt(el.querySelector('#vol-sound').value) / 100;
      settings.musicVolume = parseInt(el.querySelector('#vol-music').value) / 100;
      settings.graphics = el.querySelector('#select-graphics').value;
      SaveSystem.saveSettings(settings);
      this._showToast('Einstellungen gespeichert ✓');
      setTimeout(() => this.showScreen('main-menu'), 600);
    };
  }

  // ───────────────────────────────────────────
  // HUD
  // ───────────────────────────────────────────
  _buildHUD() {
    const el = document.getElementById('hud');
    if (!el) return;
    el.style.background = 'transparent';
    el.innerHTML = `
      <div class="bb-hud-top">
        <div class="bb-hud-team t0">
          <div class="bb-hud-tname">HOME</div>
          <div class="bb-hud-score" id="score-0">0</div>
        </div>
        <div class="bb-hud-center">
          <div class="bb-hud-q" id="quarter-label">Q1</div>
          <div class="bb-hud-timer" id="quarter-timer">2:00</div>
        </div>
        <div class="bb-hud-team t1">
          <div class="bb-hud-tname">AWAY</div>
          <div class="bb-hud-score" id="score-1">0</div>
        </div>
      </div>
      <div class="bb-shotclock" id="shot-clock">24</div>
      <div class="bb-poss-bar" id="possession-bar">
        <div class="bb-poss-dot" id="poss-dot" style="background:#ff7777"></div>
        <span id="poss-label">HOME</span>
      </div>
      <div id="shot-charge" style="display:none">
        <div class="bb-charge">
          <div class="bb-charge-label">POWER</div>
          <div class="bb-charge-bar"><div class="bb-charge-fill" id="shot-charge-fill" style="width:0%"></div></div>
        </div>
      </div>
      <div class="bb-ctrl-hint" id="hud-controls"></div>
    `;

    this._updateControlsHint();
  }

  _updateControlsHint() {
    const el = document.getElementById('hud-controls');
    if (!el) return;
    const settings = SaveSystem.getSettings();
    const isAuto = (settings.controlMode || 'auto') === 'auto';
    const row = (key, label) => `<div class="bb-ctrl-line"><span class="bb-key">${key}</span> ${label}</div>`;

    el.innerHTML = `
      <h4>STEUERUNG</h4>
      ${row('WASD','Bewegen')}
      ${isAuto ? `
        ${row('J','Werfen')}
        ${row('K','Passen')}
      ` : `
        ${row('Space↑','Werfen')}
        ${row('E','Passen')}
        ${row('Q','Dribble')}
        ${row('R','Dreher')}
        ${row('Maus','Kamera')}
      `}
      ${row('Shift','Sprint')}
      ${row('Esc','Pause')}
    `;
  }

  updateHUD({ quarterTime, shotClock, quarter, score, possession, shotCharge }) {
    const timer = document.getElementById('quarter-timer');
    const shotEl = document.getElementById('shot-clock');
    const ql = document.getElementById('quarter-label');
    const sc0 = document.getElementById('score-0');
    const sc1 = document.getElementById('score-1');
    const pd = document.getElementById('poss-dot');
    const pl = document.getElementById('poss-label');
    const shotChargeEl = document.getElementById('shot-charge');
    const shotFill = document.getElementById('shot-charge-fill');

    if (timer && quarterTime !== undefined) {
      const m = Math.floor(quarterTime / 60);
      const s = Math.floor(quarterTime % 60);
      timer.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    }
    if (shotEl && shotClock !== undefined) {
      const sc = Math.ceil(shotClock);
      shotEl.textContent = sc;
      shotEl.classList.toggle('urgent', sc <= 5);
    }
    if (ql && quarter !== undefined) {
      ql.textContent = `Q${quarter}`;
    }
    if (sc0 && score) sc0.textContent = score[0];
    if (sc1 && score) sc1.textContent = score[1];
    if (pd && pl && possession !== undefined) {
      pd.style.background = possession === 0 ? '#ff6666' : '#6699ff';
      pl.textContent = possession === 0 ? 'HOME' : 'AWAY';
    }
    if (shotChargeEl) {
      if (shotCharge !== undefined) {
        shotChargeEl.style.display = 'block';
        if (shotFill) shotFill.style.width = (shotCharge * 100) + '%';
      } else {
        shotChargeEl.style.display = 'none';
      }
    }
  }

  showEventPopup(text, type = 'score') {
    const popup = document.createElement('div');
    popup.className = 'bb-popup';
    const colors = { score:'#ff9a00', three:'#22ff88', miss:'#ff4444', steal:'#44aaff', block:'#ff44ff' };
    popup.style.color = colors[type] || '#ff9a00';
    popup.style.textShadow = `0 0 30px ${colors[type] || '#ff9a00'}`;
    popup.textContent = text;
    document.getElementById('hud').appendChild(popup);
    setTimeout(() => popup.remove(), 1700);
  }

  // ───────────────────────────────────────────
  // RESULT MODAL
  // ───────────────────────────────────────────
  _buildResultModal() {}

  showResultModal({ result, score, coins, earnedPack }) {
    const overlay = document.getElementById('result-modal');
    if (!overlay) return;

    const resultText = result === 'win' ? i18n.t('you_win') : result === 'lose' ? i18n.t('you_lose') : i18n.t('draw');
    const resultColor = result === 'win' ? '#22cc44' : result === 'lose' ? '#cc2244' : '#e8a020';

    overlay.innerHTML = `
      <div class="bb-modal" style="text-align:center">
        <div style="font-size:38px;font-weight:900;color:${resultColor};margin-bottom:12px">${resultText}</div>
        <div style="display:flex;align-items:center;justify-content:center;gap:24px;font-size:64px;font-weight:900;margin:16px 0">
          <span style="color:#ff7777">${score[0]}</span>
          <span style="color:#aac4ee;font-size:36px">:</span>
          <span style="color:#7799ff">${score[1]}</span>
        </div>
        <div style="background:rgba(255,200,0,.12);border:1px solid rgba(255,200,0,.35);border-radius:12px;padding:14px;margin:12px 0;font-size:20px;font-weight:700;color:#ff9a00">
          🪙 +${coins} ${i18n.t('earned_coins')}
        </div>
        ${earnedPack ? `<div style="background:rgba(205,127,50,.12);border:1px solid rgba(205,127,50,.4);border-radius:12px;padding:12px;margin:8px 0;font-size:16px;color:#cd7f32">🥉 ${i18n.t('earned_pack')}!</div>` : ''}
        <div class="bb-btn-row" style="margin-top:24px">
          <button class="bb-btn bb-btn-ghost" id="btn-result-menu">${i18n.t('main_menu')}</button>
          <button class="bb-btn bb-btn-orange" id="btn-result-again">${i18n.t('play_again')}</button>
        </div>
      </div>
    `;
    overlay.classList.remove('hidden');

    overlay.querySelector('#btn-result-menu').onclick = () => {
      overlay.classList.add('hidden');
      this.gm?.stopGame();
      this.showScreen('main-menu');
    };
    overlay.querySelector('#btn-result-again').onclick = () => {
      overlay.classList.add('hidden');
      this._launchGame();
    };
  }

  // ───────────────────────────────────────────
  // HALFTIME
  // ───────────────────────────────────────────
  _buildHalftimeModal() {}

  showHalftime(score) {
    const el = document.getElementById('halftime-modal');
    if (!el) return;
    el.innerHTML = `
      <div style="text-align:center;padding:40px">
        <div style="font-size:48px">⏸️</div>
        <div style="font-size:36px;font-weight:900;margin:12px 0">${i18n.t('halftime')}</div>
        <div style="font-size:64px;font-weight:900;color:#e8a020">${score[0]} : ${score[1]}</div>
      </div>
    `;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 2800);
  }

  // ───────────────────────────────────────────
  // LOADING SCREEN
  // ───────────────────────────────────────────
  _buildLoadingScreen() {
    const el = document.getElementById('loading-screen');
    if (!el) return;
    el.innerHTML = `
      <div class="bb-title">BASKETBALL PRO</div>
      <div class="bb-spinner"></div>
      <div style="color:#aac4ee;font-size:14px;letter-spacing:2px">WIRD GELADEN ...</div>
    `;
  }

  // ───────────────────────────────────────────
  // SCREEN MANAGEMENT
  // ───────────────────────────────────────────
  showScreen(id) {
    document.querySelectorAll('.ui-screen').forEach(el => el.classList.add('hidden'));
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
    this.currentScreen = id;

    // Render dynamic screens
    if (id === 'mode-selector') this._renderModeSelector();
    if (id === 'my-players') this._renderMyPlayers();
    if (id === 'pack-store') this._renderPackStore();
    if (id === 'spin-wheel') this._renderSpinWheel();
    if (id === 'settings') this._renderSettings();

    if (id === 'hud') {
      this._updateControlsHint();
    }
  }

  _showOnlineMenu() {
    this._showToast('Online-Modus kommt bald! 🌐');
  }

  _showToast(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
      background:rgba(0,0,0,0.85); color:#fff; padding:12px 24px;
      border-radius:24px; font-size:15px; font-weight:600;
      border:1px solid rgba(255,255,255,0.2);
      z-index:9999; animation:popupAnim 2s forwards;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  // ───────────────────────────────────────────
  // BIND GAME EVENTS
  // ───────────────────────────────────────────
  _bindGameEvents() {
    if (!this.gm) return;

    this.gm.on('timerUpdate', data => {
      const localPlayer = this.gm.players?.find(p => p.isLocalPlayer);
      this.updateHUD({
        ...data,
        possession: this.gm.possession,
        shotCharge: localPlayer?.isChargingShot ? localPlayer.shootPower : undefined,
      });
    });

    this.gm.on('score', ({ team, points, score, isThree }) => {
      const text = isThree ? `🔥 3 PUNKTE!` : `+${points}`;
      const type = isThree ? 'three' : 'score';
      this.showEventPopup(text, type);
    });

    this.gm.on('gameOver', (data) => {
      this.showResultModal(data);
    });

    this.gm.on('halftime', ({ score }) => {
      this.showHalftime(score);
    });

    this.gm.on('possession', ({ team }) => {
      this.updateHUD({ possession: team });
    });

    this.gm.on('rimHit', () => {
      // No popup for rim hit
    });

    this.gm.on('shotClockViolation', () => {
      this.showEventPopup('SHOT CLOCK!', 'miss');
    });

    document.addEventListener('keydown', e => {
      if (e.code === 'Escape') {
        if (this.gm.state === 'playing') {
          this.gm.pauseGame();
          this._showPauseMenu();
        } else if (this.gm.state === 'paused') {
          this.gm.resumeGame();
          document.getElementById('pause-modal')?.classList.add('hidden');
        }
      }
    });
  }

  _showPauseMenu() {
    const existing = document.getElementById('pause-modal');
    if (existing) { existing.classList.remove('hidden'); return; }

    const el = document.createElement('div');
    el.id = 'pause-modal';
    el.className = 'modal-overlay';
    el.innerHTML = `
      <div class="bb-modal" style="max-width:340px;text-align:center">
        <div style="font-size:36px;font-weight:900;margin-bottom:24px">⏸ PAUSE</div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <button class="bb-btn bb-btn-orange" id="btn-resume">Weiter spielen</button>
          <button class="bb-btn bb-btn-ghost"  id="btn-settings-pause">Einstellungen</button>
          <button class="bb-btn bb-btn-red"    id="btn-quit-pause">Zum Menü</button>
        </div>
      </div>
    `;
    document.body.appendChild(el);

    el.querySelector('#btn-resume').onclick = () => {
      this.gm.resumeGame();
      el.classList.add('hidden');
    };
    el.querySelector('#btn-settings-pause').onclick = () => {
      el.classList.add('hidden');
      this.showScreen('settings');
    };
    el.querySelector('#btn-quit-pause').onclick = () => {
      el.remove();
      this.gm.stopGame();
      this.showScreen('main-menu');
    };
  }

  _refreshAll() {
    if (this.currentScreen === 'main-menu') this._buildMainMenu();
    if (this.currentScreen === 'settings') this._renderSettings();
    if (this.currentScreen === 'mode-selector') this._renderModeSelector();
  }
}

export default UIManager;
