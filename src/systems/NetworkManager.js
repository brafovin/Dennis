import { io } from 'socket.io-client';

export class NetworkManager {
  constructor(gameManager) {
    this.gm = gameManager;
    this.socket = null;
    this.roomId = null;
    this.localTeam = 0;
    this.playerId = null;
    this.remotePlayers = new Map();
    this.connected = false;
    this.callbacks = {};
    this._pingStart = 0;
    this.ping = 0;
  }

  connect(serverUrl = 'http://localhost:3001') {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(serverUrl, { timeout: 8000 });

        this.socket.on('connect', () => {
          this.connected = true;
          this._emit('connected');
          this._startPing();
          resolve();
        });

        this.socket.on('connect_error', (err) => {
          this.connected = false;
          reject(err);
        });

        this.socket.on('disconnect', () => {
          this.connected = false;
          this._emit('disconnected');
        });

        this._bindGameEvents();
      } catch (e) {
        reject(e);
      }
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.connected = false;
  }

  findMatch(mode, playerData) {
    if (!this.connected) return;
    this.socket.emit('findMatch', { mode, playerData });
    this._emit('searching');
  }

  sendPlayerMove(position, rotation, velocity, hasBall) {
    if (!this.connected || !this.roomId) return;
    this.socket.emit('playerMove', { position, rotation, velocity, hasBall });
  }

  sendBallShot(from, target, power, accuracy) {
    if (!this.connected || !this.roomId) return;
    this.socket.emit('ballShot', { from, target, power, accuracy });
  }

  sendBasketScored(team, points, isThree) {
    if (!this.connected || !this.roomId) return;
    this.socket.emit('basketScored', { team, points, isThree });
  }

  sendPass(toPlayerId, target) {
    if (!this.connected || !this.roomId) return;
    this.socket.emit('passBall', { toPlayerId, target });
  }

  _bindGameEvents() {
    const s = this.socket;

    s.on('joinedRoom', ({ roomId, team, playerId, players }) => {
      this.roomId = roomId;
      this.localTeam = team;
      this.playerId = playerId;
      this._emit('joinedRoom', { roomId, team, players });
    });

    s.on('playerJoined', ({ player, players }) => {
      this._emit('playerJoined', { player, players });
    });

    s.on('gameStart', ({ players, mode }) => {
      this._emit('gameStart', { players, mode });
    });

    s.on('playerMoved', ({ id, position, rotation, velocity, hasBall }) => {
      this._emit('playerMoved', { id, position, rotation, velocity, hasBall });
    });

    s.on('ballShot', ({ shooterId, from, target, power, accuracy }) => {
      this._emit('ballShot', { shooterId, from, target, power, accuracy });
    });

    s.on('scoreUpdate', ({ score, team, points, isThree }) => {
      this._emit('scoreUpdate', { score, team, points, isThree });
    });

    s.on('ballPassed', ({ fromId, toPlayerId, target }) => {
      this._emit('ballPassed', { fromId, toPlayerId, target });
    });

    s.on('playerLeft', ({ id, players }) => {
      this._emit('playerLeft', { id, players });
    });

    s.on('gamePaused', ({ reason }) => {
      this._emit('gamePaused', { reason });
    });

    s.on('pong', () => {
      this.ping = Date.now() - this._pingStart;
      setTimeout(() => this._sendPing(), 3000);
    });
  }

  _startPing() {
    setTimeout(() => this._sendPing(), 1000);
  }

  _sendPing() {
    if (!this.connected) return;
    this._pingStart = Date.now();
    this.socket.emit('ping');
  }

  on(event, cb) {
    this.callbacks[event] = cb;
  }

  _emit(event, data) {
    if (this.callbacks[event]) this.callbacks[event](data);
  }
}

export default NetworkManager;
