import * as THREE from 'three';
import { GAME, GAME_MODES, CONTROL_MODES, COURT, HOOP } from '../constants.js';
import { Player } from './Player.js';
import { Ball } from './Ball.js';
import { Court } from './Court.js';
import { ThirdPersonCamera } from './ThirdPersonCamera.js';
import { AIPlayer } from './AI.js';
import { inputManager } from '../systems/InputManager.js';
import { SaveSystem } from '../systems/SaveSystem.js';

export const GameState = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  HALFTIME: 'halftime',
  GAME_OVER: 'game_over',
};

export class GameManager {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.state = GameState.MENU;
    this.callbacks = {};

    this.players = [];
    this.team0 = [];
    this.team1 = [];
    this.aiPlayers = [];
    this.ball = null;
    this.court = null;
    this.tpCamera = null;

    this.score = [0, 0];
    this.quarter = 1;
    this.quarterTime = GAME.QUARTER_DURATION;
    this.shotClock = GAME.SHOT_CLOCK;
    this.possession = 0;
    this.timeoutCount = [2, 2];
    this.lastScoringTeam = -1;

    this.shotChargeBar = null;
    this.mode = GAME_MODES.ONE_V_ONE;
    this.controlMode = CONTROL_MODES.AUTO;

    this._autoShootCooldown = 0;
    this._autoPassCooldown = 0;

    this._bindInput();
    this._setupPointerLock();
  }

  _bindInput() {
    inputManager.on('keydown', code => {
      if (this.state !== GameState.PLAYING) return;
      const localPlayer = this.players.find(p => p.isLocalPlayer);
      if (!localPlayer) return;

      if (this.controlMode === CONTROL_MODES.AUTO) {
        if (code === 'Space' || code === 'KeyJ') {
          this._autoShoot(localPlayer);
        }
        if (code === 'KeyE' || code === 'KeyK') {
          this._autoPass(localPlayer);
        }
      }
    });

    inputManager.on('keyup', code => {
      if (this.state !== GameState.PLAYING) return;
      const localPlayer = this.players.find(p => p.isLocalPlayer);
      if (!localPlayer) return;

      if (this.controlMode === CONTROL_MODES.MANUAL && localPlayer.hasBall) {
        if (code === 'Space') {
          const power = localPlayer.releaseShot();
          this._manualShoot(localPlayer, power);
        }
        if (code === 'KeyE') {
          this._manualPass(localPlayer);
        }
      }
    });
  }

  _setupPointerLock() {
    document.addEventListener('click', () => {
      if (this.state === GameState.PLAYING) {
        document.getElementById('game-canvas')?.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement) {
        document.addEventListener('mousemove', this._onMouseMove.bind(this));
      } else {
        document.removeEventListener('mousemove', this._onMouseMove.bind(this));
      }
    });
  }

  _onMouseMove(e) {
    this.tpCamera?.onMouseMove(e.movementX, e.movementY);
  }

  on(event, cb) {
    this.callbacks[event] = cb;
  }

  _emit(event, data) {
    if (this.callbacks[event]) this.callbacks[event](data);
  }

  startGame(config) {
    this.mode = config.mode || GAME_MODES.ONE_V_ONE;
    this.controlMode = config.controlMode || CONTROL_MODES.AUTO;
    this.playerConfig = config.playerConfig;

    this._clearScene();
    this._setupScene();
    this._spawnPlayers();
    this._spawnBall();
    this._setupCamera();

    this.score = [0, 0];
    this.quarter = 1;
    this.quarterTime = GAME.QUARTER_DURATION;
    this.shotClock = GAME.SHOT_CLOCK;
    this.possession = 0;
    this.state = GameState.PLAYING;

    this._emit('gameStart', { mode: this.mode });
    this._startPossession(0);
  }

  _clearScene() {
    this.players.forEach(p => p.destroy());
    this.players = [];
    this.team0 = [];
    this.team1 = [];
    this.aiPlayers = [];

    if (this.ball) {
      this.scene.remove(this.ball.mesh);
      this.scene.remove(this.ball.trail);
      this.ball = null;
    }
    if (this.court) {
      this.court.meshes.forEach(m => this.scene.remove(m));
      this.court = null;
    }
  }

  _setupScene() {
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.FogExp2(0x1a1a2e, 0.015);
    this.court = new Court(this.scene);
  }

  _spawnPlayers() {
    const modeMap = {
      [GAME_MODES.ONE_V_ONE]: 1,
      [GAME_MODES.TWO_V_TWO]: 2,
      [GAME_MODES.THREE_V_THREE]: 3,
    };
    const count = modeMap[this.mode] || 1;

    const pcfg = this.playerConfig || {};

    // Team 0 (local player's team)
    for (let i = 0; i < count; i++) {
      const isLocal = i === 0;
      const startZ = -(count === 1 ? 5 : 4 + i * 2);
      const startX = count > 1 ? (i - (count - 1) / 2) * 3 : 0;

      const player = new Player(this.scene, {
        id: `t0_${i}`,
        name: isLocal ? (pcfg.name || 'Du') : `CPU ${i}`,
        number: isLocal ? (pcfg.number || 23) : (i + 1),
        team: 0,
        isLocalPlayer: isLocal,
        controlMode: this.controlMode,
        startX,
        startZ,
        skinColor: isLocal ? pcfg.skinColor : '#c68642',
        jerseyColor: isLocal ? pcfg.jerseyColor : '#ff0000',
        shortsColor: isLocal ? pcfg.shortsColor : '#aa0000',
        shoeColor: isLocal ? pcfg.shoeColor : '#111111',
        skills: isLocal ? pcfg.skills : { speed: 70, shooting: 65, dribbling: 70, passing: 65, defense: 65 },
      });

      this.team0.push(player);
      this.players.push(player);

      if (!isLocal) {
        this.aiPlayers.push(new AIPlayer(player, 0, this));
      }
    }

    // Team 1 (CPU opponents)
    for (let i = 0; i < count; i++) {
      const startZ = (count === 1 ? 5 : 4 + i * 2);
      const startX = count > 1 ? (i - (count - 1) / 2) * 3 : 0;

      const player = new Player(this.scene, {
        id: `t1_${i}`,
        name: `CPU${i + count + 1}`,
        number: i + count + 1,
        team: 1,
        isLocalPlayer: false,
        controlMode: CONTROL_MODES.AUTO,
        startX,
        startZ,
        skinColor: '#8d5524',
        jerseyColor: '#0000ff',
        shortsColor: '#0000aa',
        shoeColor: '#333333',
        skills: { speed: 72, shooting: 68, dribbling: 72, passing: 67, defense: 70 },
      });

      this.team1.push(player);
      this.players.push(player);
      this.aiPlayers.push(new AIPlayer(player, 1, this));
    }
  }

  _spawnBall() {
    this.ball = new Ball(this.scene);
    this.ball.on('basket', ({ side, position }) => this._onBasket(side, position));
    this.ball.on('bounce', () => this._emit('bounce', {}));
    this.ball.on('rimHit', () => this._emit('rimHit', {}));
  }

  _setupCamera() {
    this.tpCamera = new ThirdPersonCamera(this.camera);
    const localPlayer = this.players.find(p => p.isLocalPlayer);
    if (localPlayer) this.tpCamera.setTarget(localPlayer);
  }

  _startPossession(team) {
    this.possession = team;
    this.shotClock = GAME.SHOT_CLOCK;

    const teamPlayers = team === 0 ? this.team0 : this.team1;
    const pointGuard = teamPlayers[0];

    if (pointGuard) {
      pointGuard.hasBall = true;
      this.ball.attachToPlayer(pointGuard);
    }

    this._emit('possession', { team, player: pointGuard });
  }

  _onBasket(rimSide, position) {
    // rimSide 1 = team 1 scored, -1 = team 0 scored
    const scoringTeam = rimSide > 0 ? 0 : 1;
    const isThree = this.court?.isInThreePointRange(position, rimSide);
    const points = isThree ? 3 : 2;

    this.score[scoringTeam] += points;
    this.lastScoringTeam = scoringTeam;

    this._emit('score', {
      team: scoringTeam,
      points,
      score: [...this.score],
      isThree,
    });

    SaveSystem.updateStats({ pointsScored: points });

    setTimeout(() => {
      if (this.state === GameState.PLAYING) {
        this._startPossession(1 - scoringTeam);
      }
    }, 1500);
  }

  pickupBall(player, ball) {
    if (ball.owner) return;
    ball.attachToPlayer(player);
    player.hasBall = true;
    this.possession = player.team;
    this.shotClock = GAME.SHOT_CLOCK;
    this._emit('pickup', { player });
  }

  pass(fromPlayer, toPlayer, ball) {
    if (!fromPlayer.hasBall) return;
    fromPlayer.hasBall = false;
    ball.detachFromPlayer();

    const target = toPlayer.position.clone();
    target.y += 1.0;
    ball.shoot(fromPlayer.getShootPosition(), target, 0.8, 1.0);
    ball.inFlight = true;

    this._emit('pass', { from: fromPlayer, to: toPlayer });

    // Pickup on arrival
    setTimeout(() => {
      if (!ball.owner && ball.isNearPlayer(toPlayer.position, 1.5)) {
        this.pickupBall(toPlayer, ball);
      }
    }, 500);
  }

  _autoShoot(player) {
    if (!player.hasBall || this._autoShootCooldown > 0) return;

    const basket = this._getNearestBasket(player);
    const dist = player.position.distanceTo(basket);

    if (dist > 12) {
      // Too far, dribble closer
      this._emit('hint', 'too_far');
      return;
    }

    const accuracy = Math.min(1, (player.skills.shooting / 99) * (1 - dist * 0.03) + 0.3);
    player.hasBall = false;
    player.isShooting = true;

    this.ball.detachFromPlayer();
    this.ball.shoot(player.getShootPosition(), basket, 1.0, accuracy);

    this._autoShootCooldown = 2;
    this._emit('shoot', { player, basket, accuracy, dist });

    setTimeout(() => { player.isShooting = false; }, 600);
  }

  _manualShoot(player, power) {
    if (!player.hasBall) return;

    const basket = this._getNearestBasket(player);
    const dist = player.position.distanceTo(basket);

    const perfectPower = 0.7 + dist * 0.03;
    const powerDiff = Math.abs(power - perfectPower);
    const accuracy = Math.max(0.1, (player.skills.shooting / 99) - powerDiff * 1.5);

    player.hasBall = false;
    this.ball.detachFromPlayer();
    this.ball.shoot(player.getShootPosition(), basket, power, accuracy);
    this._emit('shoot', { player, basket, accuracy, dist });
  }

  _autoPass(player) {
    if (!player.hasBall || this._autoPassCooldown > 0) return;

    const teammates = (player.team === 0 ? this.team0 : this.team1)
      .filter(p => p !== player);

    if (!teammates.length) return;

    const opponents = player.team === 0 ? this.team1 : this.team0;
    const openMate = teammates.find(mate => {
      const guarded = opponents.some(opp => opp.position.distanceTo(mate.position) < 2.5);
      return !guarded;
    }) || teammates[0];

    this.pass(player, openMate, this.ball);
    this._autoPassCooldown = 0.8;
  }

  _manualPass(player) {
    if (!player.hasBall) return;
    const teammates = (player.team === 0 ? this.team0 : this.team1)
      .filter(p => p !== player);
    if (!teammates.length) return;

    const facing = player.getFacingDirection();
    let bestMate = null;
    let bestDot = -1;

    teammates.forEach(mate => {
      const dir = new THREE.Vector3().subVectors(mate.position, player.position).normalize();
      const dot = dir.dot(facing);
      if (dot > bestDot) { bestDot = dot; bestMate = mate; }
    });

    if (bestMate) this.pass(player, bestMate, this.ball);
  }

  _getNearestBasket(player) {
    const rim1 = new THREE.Vector3(0, HOOP.HEIGHT, COURT.LENGTH / 2 - HOOP.OVERHANG);
    const rim2 = new THREE.Vector3(0, HOOP.HEIGHT, -(COURT.LENGTH / 2 - HOOP.OVERHANG));

    // Team 0 attacks positive Z, team 1 attacks negative Z
    const attackTarget = player.team === 0 ? rim1 : rim2;
    return attackTarget;
  }

  update(delta) {
    if (this.state !== GameState.PLAYING) return;

    this._autoShootCooldown = Math.max(0, this._autoShootCooldown - delta);
    this._autoPassCooldown = Math.max(0, this._autoPassCooldown - delta);

    // Timer
    this.quarterTime -= delta;
    this.shotClock -= delta;

    if (this.shotClock <= 0) {
      this.shotClock = 0;
      this._emit('shotClockViolation', {});
      this._startPossession(1 - this.possession);
    }

    if (this.quarterTime <= 0) {
      this._endQuarter();
      return;
    }

    // Auto control: face basket when having ball
    const localPlayer = this.players.find(p => p.isLocalPlayer);
    if (localPlayer && localPlayer.hasBall && this.controlMode === CONTROL_MODES.AUTO) {
      const basket = this._getNearestBasket(localPlayer);
      const dir = new THREE.Vector3().subVectors(basket, localPlayer.position);
      if (dir.length() > 0.1) {
        const targetRot = Math.atan2(dir.x, dir.z);
        const diff = ((targetRot - localPlayer.rotation + Math.PI) % (Math.PI * 2)) - Math.PI;
        localPlayer.rotation += diff * Math.min(1, delta * 3);
      }
    }

    // Update local player
    if (localPlayer) {
      localPlayer.update(delta, inputManager);
    }

    // Update AI players
    const allOpponents0 = this.team1;
    const allOpponents1 = this.team0;

    this.aiPlayers.forEach(ai => {
      const opponents = ai.team === 0 ? allOpponents0 : allOpponents1;
      const teammates = (ai.team === 0 ? this.team0 : this.team1).filter(p => p !== ai.player);
      ai.update(delta, this.ball, opponents, teammates);

      // Auto pickup
      if (!this.ball.owner && this.ball.isNearPlayer(ai.player.position, 1.0)) {
        this.pickupBall(ai.player, this.ball);
      }
    });

    // Update non-local, non-AI players
    this.players.forEach(p => {
      if (!p.isLocalPlayer && !this.aiPlayers.some(ai => ai.player === p)) {
        p.update(delta);
      }
    });

    // Ball loose pickup by local player
    if (localPlayer && !this.ball.owner && this.ball.isNearPlayer(localPlayer.position, 1.2)) {
      this.pickupBall(localPlayer, this.ball);
    }

    this.ball.update(delta);
    this.tpCamera?.update(delta);

    // Shot charge HUD
    if (localPlayer?.isChargingShot) {
      this._emit('shotCharge', localPlayer.shootPower);
    }

    this._emit('timerUpdate', {
      quarterTime: this.quarterTime,
      shotClock: this.shotClock,
      quarter: this.quarter,
      score: this.score,
    });

    inputManager.resetMouse();
  }

  _endQuarter() {
    this.quarter++;
    if (this.quarter === 3) {
      this.state = GameState.HALFTIME;
      this._emit('halftime', { score: this.score });
      setTimeout(() => {
        this.state = GameState.PLAYING;
        this.quarterTime = GAME.QUARTER_DURATION;
        this._startPossession(1 - (this.lastScoringTeam >= 0 ? this.lastScoringTeam : 0));
      }, 3000);
    } else if (this.quarter > 4) {
      this._endGame();
    } else {
      this.quarterTime = GAME.QUARTER_DURATION;
      this._startPossession(1 - (this.lastScoringTeam >= 0 ? this.lastScoringTeam : 0));
      this._emit('newQuarter', { quarter: this.quarter });
    }
  }

  _endGame() {
    this.state = GameState.GAME_OVER;
    const localTeam = 0;
    const won = this.score[localTeam] > this.score[1 - localTeam];
    const draw = this.score[0] === this.score[1];
    const result = draw ? 'draw' : won ? 'win' : 'lose';

    const coins = result === 'win' ? 15 + Math.floor(Math.random() * 10) : result === 'draw' ? 5 : 2;
    SaveSystem.addCoins(coins);
    SaveSystem.updateStats({
      gamesPlayed: 1,
      gamesWon: won ? 1 : 0,
    });

    const earnedPack = result === 'win' && Math.random() < 0.4;
    if (earnedPack) {
      SaveSystem.addToInventory({ type: 'pack', rarity: 'bronze' });
    }

    this._emit('gameOver', { result, score: this.score, coins, earnedPack });
  }

  pauseGame() {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED;
      this._emit('pause', {});
    }
  }

  resumeGame() {
    if (this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING;
      this._emit('resume', {});
    }
  }

  stopGame() {
    this._clearScene();
    this.state = GameState.MENU;
    this._emit('stop', {});
  }
}

export default GameManager;
