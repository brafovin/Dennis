import { i18n } from '../i18n/index.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { GAME_MODES, CONTROL_MODES, JERSEY_COLORS, SKIN_COLORS, PACK_COSTS, PLAYER_POSITIONS } from '../constants.js';

export class UIManager {
  constructor(gameManager) {
    this.gm = gameManager;
    this.currentScreen = 'main-menu';
    this.pendingGameConfig = {};
    this._initDOM();
    this._bindGameEvents();
    document.addEventListener('languageChanged', () => this._refreshAll());
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
      <div class="menu-bg-balls" id="bg-balls"></div>
      <div class="game-title" data-i18n="title">${i18n.t('title')}</div>
      <div class="game-subtitle">STREET BASKETBALL 3D</div>
      <div class="menu-buttons">
        <button class="btn btn-primary btn-full btn-lg" id="btn-offline" data-i18n="play_offline">${i18n.t('play_offline')}</button>
        <button class="btn btn-secondary btn-full" id="btn-online" data-i18n="play_online">${i18n.t('play_online')}</button>
        <button class="btn btn-ghost btn-full" id="btn-create-player" data-i18n="create_player">${i18n.t('create_player')}</button>
        <button class="btn btn-ghost btn-full" id="btn-my-players" data-i18n="my_players">${i18n.t('my_players')}</button>
        <button class="btn btn-ghost btn-full" id="btn-packs" data-i18n="pack_store">${i18n.t('pack_store')}</button>
        <button class="btn btn-ghost btn-full" id="btn-spin" data-i18n="spin_wheel">${i18n.t('spin_wheel')}</button>
        <button class="btn btn-ghost btn-full" id="btn-settings" data-i18n="settings">${i18n.t('settings')}</button>
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
      <div class="modal-box" style="max-width:640px;width:90%">
        <h2 style="font-size:28px;font-weight:900;margin-bottom:24px" data-i18n="select_mode">${i18n.t('select_mode')}</h2>

        <div class="mode-grid" id="mode-grid">
          ${[
            { id: '1v1', icon: '🏀', label: i18n.t('mode_1v1'), desc: '1 vs 1 - Mano a mano' },
            { id: '2v2', icon: '⛹️', label: i18n.t('mode_2v2'), desc: '2 vs 2 - Team play' },
            { id: '3v3', icon: '🏆', label: i18n.t('mode_3v3'), desc: '3 vs 3 - Street ball' },
          ].map(m => `
            <div class="mode-card ${this.pendingGameConfig.mode === m.id ? 'selected' : ''}"
                 data-mode="${m.id}">
              <div class="mode-icon">${m.icon}</div>
              <div class="mode-title">${m.label}</div>
              <div class="mode-desc">${m.desc}</div>
            </div>
          `).join('')}
        </div>

        <div style="margin:20px 0">
          <div style="font-size:13px;text-transform:uppercase;letter-spacing:2px;color:#aabbcc;margin-bottom:12px">${i18n.t('control_mode')}</div>
          <div class="control-toggle">
            <div class="control-option ${controlMode === 'auto' ? 'active' : ''}" data-ctrl="auto">
              <div class="ctrl-icon">🎮</div>
              <div class="ctrl-title">${i18n.t('auto_mode')}</div>
              <div class="ctrl-desc">${i18n.t('auto_desc')}</div>
            </div>
            <div class="control-option ${controlMode === 'manual' ? 'active' : ''}" data-ctrl="manual">
              <div class="ctrl-icon">🕹️</div>
              <div class="ctrl-title">${i18n.t('manual_mode')}</div>
              <div class="ctrl-desc">${i18n.t('manual_desc')}</div>
            </div>
          </div>
        </div>

        <div style="display:flex;gap:12px;justify-content:center">
          <button class="btn btn-ghost" id="btn-back-mode">${i18n.t('back')}</button>
          <button class="btn btn-primary btn-lg" id="btn-start-game">${i18n.t('start_game')}</button>
        </div>
      </div>
    `;

    // Mode selection
    el.querySelectorAll('.mode-card').forEach(card => {
      card.onclick = () => {
        el.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.pendingGameConfig.mode = card.dataset.mode;
      };
    });

    // Control mode
    el.querySelectorAll('.control-option').forEach(opt => {
      opt.onclick = () => {
        el.querySelectorAll('.control-option').forEach(o => o.classList.remove('active'));
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
      <div class="modal-box" style="max-width:600px;width:90%">
        <h2 style="font-size:28px;font-weight:900;margin-bottom:20px">${i18n.t('my_players')}</h2>
        ${players.length === 0 ? `
          <p style="color:#aabbcc;text-align:center;padding:40px 0">
            Noch keine Spieler erstellt.<br>
            <span style="font-size:48px">🏀</span>
          </p>
        ` : `
          <div class="players-grid">
            ${players.map(p => `
              <div class="player-card ${p.id === activeId ? 'active-player' : ''}" data-id="${p.id}">
                <div class="player-card-number" style="color:${p.jerseyColor}">#${p.number}</div>
                <div class="player-card-name">${p.name}</div>
                <div class="player-card-pos">${i18n.t(p.position)}</div>
                ${p.id === activeId ? '<div style="font-size:11px;color:#e8a020;margin-top:6px">✓ AKTIV</div>' : ''}
              </div>
            `).join('')}
          </div>
        `}
        <div style="display:flex;gap:12px;justify-content:center;margin-top:20px">
          <button class="btn btn-ghost" id="btn-back-players">${i18n.t('back')}</button>
          <button class="btn btn-primary" id="btn-new-player">${i18n.t('create_player')}</button>
        </div>
      </div>
    `;

    el.querySelectorAll('.player-card').forEach(card => {
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
      { id: 'bronze', cls: 'bronze', icon: '🥉', name: i18n.t('bronze_pack'), cost: PACK_COSTS.BRONZE, odds: '3× Common, 1× Uncommon' },
      { id: 'silver', cls: 'silver', icon: '🥈', name: i18n.t('silver_pack'), cost: PACK_COSTS.SILVER, odds: '2× Uncommon, 1× Rare' },
      { id: 'gold',   cls: 'gold',   icon: '🥇', name: i18n.t('gold_pack'),   cost: PACK_COSTS.GOLD,   odds: '1× Rare, 1× Epic' },
      { id: 'plat',   cls: 'plat',   icon: '💎', name: i18n.t('platinum_pack'), cost: PACK_COSTS.PLATINUM, odds: '1× Legendary' },
    ];

    el.innerHTML = `
      <div class="modal-box" style="max-width:560px;width:90%">
        <h2 style="font-size:28px;font-weight:900;margin-bottom:8px">${i18n.t('packs_title')}</h2>
        <div class="coin-display" style="justify-content:center;margin-bottom:20px">
          🪙 <span id="pack-coins">${coins}</span> ${i18n.t('your_coins')}
        </div>

        <div class="pack-grid">
          ${packs.map(p => `
            <div class="pack-card ${p.cls}" data-pack="${p.id}" data-cost="${p.cost}">
              <div class="pack-icon">${p.icon}</div>
              <div class="pack-name">${p.name}</div>
              <div class="pack-cost">🪙 ${p.cost}</div>
              <div class="pack-odds">${p.odds}</div>
            </div>
          `).join('')}
        </div>

        <div style="display:flex;gap:12px;justify-content:center;margin-top:8px">
          <button class="btn btn-ghost" id="btn-back-packs">${i18n.t('back')}</button>
        </div>
      </div>
    `;

    el.querySelectorAll('.pack-card').forEach(card => {
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
      <div class="modal-box" style="max-width:460px;width:90%;text-align:center">
        <h2 style="font-size:28px;font-weight:900;margin-bottom:8px">${i18n.t('spin_title')}</h2>
        <div class="coin-display" style="justify-content:center;margin-bottom:16px">
          🪙 ${coins} Münzen
        </div>
        <div class="wheel-container">
          <div class="wheel-pointer">▼</div>
          <canvas class="wheel-canvas" id="wheel-canvas" width="280" height="280"></canvas>
        </div>
        ${canSpin ? `
          <button class="btn btn-primary btn-lg" style="margin-top:20px" id="btn-spin-now">${i18n.t('spin')}</button>
        ` : `
          <div style="color:#aabbcc;margin-top:20px;font-size:14px">
            Du hast heute bereits gedreht.<br>Komm morgen wieder!
          </div>
        `}
        <button class="btn btn-ghost" style="margin-top:12px" id="btn-back-spin">${i18n.t('back')}</button>
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

    el.innerHTML = `
      <div class="modal-box" style="max-width:500px;width:90%">
        <h2 style="font-size:28px;font-weight:900;margin-bottom:8px">${i18n.t('settings_title')}</h2>

        <div class="settings-list">
          <!-- Language -->
          <div class="setting-row">
            <div class="setting-label">${i18n.t('language')}</div>
            <div class="lang-flag-grid">
              ${i18n.languages.map(l => `
                <button class="lang-btn ${i18n.currentLang === l.code ? 'active' : ''}" data-lang="${l.code}" title="${l.name}">
                  ${l.flag}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Control Mode -->
          <div class="setting-row">
            <div class="setting-label">${i18n.t('control_mode')}</div>
            <div class="control-toggle" style="max-width:240px">
              <div class="control-option ${settings.controlMode === 'auto' ? 'active' : ''}" data-ctrl="auto" style="padding:8px 16px">
                <div style="font-size:12px">${i18n.t('auto_mode')}</div>
              </div>
              <div class="control-option ${settings.controlMode === 'manual' ? 'active' : ''}" data-ctrl="manual" style="padding:8px 16px">
                <div style="font-size:12px">${i18n.t('manual_mode')}</div>
              </div>
            </div>
          </div>

          <!-- Sound -->
          <div class="setting-row">
            <div class="setting-label">${i18n.t('sound')}</div>
            <input type="range" class="slider-input" min="0" max="100"
                   value="${(settings.soundVolume || 0.8) * 100}" id="vol-sound">
          </div>

          <!-- Music -->
          <div class="setting-row">
            <div class="setting-label">${i18n.t('music')}</div>
            <input type="range" class="slider-input" min="0" max="100"
                   value="${(settings.musicVolume || 0.5) * 100}" id="vol-music">
          </div>

          <!-- Graphics -->
          <div class="setting-row">
            <div class="setting-label">${i18n.t('graphics')}</div>
            <select id="select-graphics" style="background:rgba(255,255,255,0.07);border:1px solid rgba(100,150,255,0.3);border-radius:8px;padding:6px 12px;color:#fff">
              <option value="low" ${settings.graphics === 'low' ? 'selected' : ''}>${i18n.t('low')}</option>
              <option value="medium" ${settings.graphics === 'medium' ? 'selected' : ''}>${i18n.t('medium')}</option>
              <option value="high" ${settings.graphics === 'high' ? 'selected' : ''}>${i18n.t('high')}</option>
            </select>
          </div>
        </div>

        <div style="display:flex;gap:12px;justify-content:center">
          <button class="btn btn-ghost" id="btn-back-settings">${i18n.t('back')}</button>
          <button class="btn btn-primary" id="btn-save-settings">${i18n.t('apply')}</button>
        </div>
      </div>
    `;

    el.querySelectorAll('.lang-btn').forEach(btn => {
      btn.onclick = () => {
        i18n.setLanguage(btn.dataset.lang);
        this._renderSettings();
      };
    });

    el.querySelectorAll('.control-option').forEach(opt => {
      opt.onclick = () => {
        el.querySelectorAll('.control-option').forEach(o => o.classList.remove('active'));
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
    el.innerHTML = `
      <div class="hud-top">
        <div class="hud-team team-0">
          <div class="hud-team-name">HOME</div>
          <div class="hud-score" id="score-0">0</div>
          <div class="hud-fouls" id="fouls-0">Fouls: 0</div>
        </div>
        <div class="hud-center">
          <div class="hud-quarter" id="quarter-label">Q1</div>
          <div class="hud-timer" id="quarter-timer">2:00</div>
        </div>
        <div class="hud-team team-1">
          <div class="hud-team-name">AWAY</div>
          <div class="hud-score" id="score-1">0</div>
          <div class="hud-fouls" id="fouls-1">Fouls: 0</div>
        </div>
      </div>
      <div class="shot-clock" id="shot-clock">24</div>
      <div class="possession-indicator" id="possession-bar">
        <div class="possession-dot" id="poss-dot" style="background:#ff6666"></div>
        <span id="poss-label">HOME</span>
      </div>
      <div class="shot-charge hidden" id="shot-charge">
        <div class="shot-charge-label">POWER</div>
        <div class="shot-charge-bar">
          <div class="shot-charge-fill" id="shot-charge-fill" style="width:0%"></div>
        </div>
      </div>
      <div class="hud-controls" id="hud-controls"></div>
    `;

    this._updateControlsHint();
  }

  _updateControlsHint() {
    const el = document.getElementById('hud-controls');
    if (!el) return;
    const settings = SaveSystem.getSettings();
    const isAuto = (settings.controlMode || 'auto') === 'auto';

    el.innerHTML = `
      <h4>STEUERUNG</h4>
      ${isAuto ? `
        <div class="ctrl-line"><span class="key-badge">WASD</span> Bewegen</div>
        <div class="ctrl-line"><span class="key-badge">J</span> Werfen</div>
        <div class="ctrl-line"><span class="key-badge">K</span> Passen</div>
        <div class="ctrl-line"><span class="key-badge">Shift</span> Sprint</div>
      ` : `
        <div class="ctrl-line"><span class="key-badge">WASD</span> Bewegen</div>
        <div class="ctrl-line"><span class="key-badge">Space ↑</span> Werfen</div>
        <div class="ctrl-line"><span class="key-badge">E</span> Passen</div>
        <div class="ctrl-line"><span class="key-badge">Q</span> Dribble</div>
        <div class="ctrl-line"><span class="key-badge">Shift</span> Sprint</div>
        <div class="ctrl-line"><span class="key-badge">R</span> Dreher</div>
        <div class="ctrl-line"><span class="key-badge">Maus</span> Kamera</div>
      `}
      <div class="ctrl-line" style="margin-top:6px"><span class="key-badge">Esc</span> Pause</div>
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
        shotChargeEl.classList.remove('hidden');
        if (shotFill) shotFill.style.width = (shotCharge * 100) + '%';
      } else {
        shotChargeEl.classList.add('hidden');
      }
    }
  }

  showEventPopup(text, type = 'score') {
    const popup = document.createElement('div');
    popup.className = `event-popup popup-${type}`;
    popup.textContent = text;
    document.getElementById('hud').appendChild(popup);
    setTimeout(() => popup.remove(), 1600);
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
      <div class="modal-box">
        <div class="modal-title" style="color:${resultColor}">${resultText}</div>
        <div class="result-score">
          <span class="score-0">${score[0]}</span>
          <span class="divider">:</span>
          <span class="score-1">${score[1]}</span>
        </div>
        <div class="reward-box">🪙 +${coins} ${i18n.t('earned_coins')}</div>
        ${earnedPack ? `<div class="reward-box" style="color:#cd7f32">🥉 ${i18n.t('earned_pack')}!</div>` : ''}
        <div style="display:flex;gap:12px;justify-content:center;margin-top:20px">
          <button class="btn btn-ghost" id="btn-result-menu">${i18n.t('main_menu')}</button>
          <button class="btn btn-primary" id="btn-result-again">${i18n.t('play_again')}</button>
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
      <div class="game-title">BASKETBALL PRO</div>
      <div class="loading-spinner"></div>
      <div style="color:#aabbcc;font-size:14px">Wird geladen...</div>
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
      <div class="modal-box" style="max-width:360px">
        <h2 style="font-size:32px;font-weight:900;margin-bottom:24px">⏸ PAUSE</h2>
        <div style="display:flex;flex-direction:column;gap:12px">
          <button class="btn btn-primary btn-full" id="btn-resume">Weiter spielen</button>
          <button class="btn btn-ghost btn-full" id="btn-settings-pause">Einstellungen</button>
          <button class="btn btn-danger btn-full" id="btn-quit-pause">Zum Menü</button>
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
