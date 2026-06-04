export class SaveSystem {
  static KEYS = {
    PLAYERS: 'bball_players',
    ACTIVE_PLAYER: 'bball_active_player',
    COINS: 'bball_coins',
    SETTINGS: 'bball_settings',
    STATS: 'bball_stats',
    INVENTORY: 'bball_inventory',
    DAILY_SPIN: 'bball_daily_spin',
  };

  static save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save:', e);
    }
  }

  static load(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  static getPlayers() {
    return this.load(this.KEYS.PLAYERS, []);
  }

  static savePlayers(players) {
    this.save(this.KEYS.PLAYERS, players);
  }

  static addPlayer(player) {
    const players = this.getPlayers();
    player.id = Date.now().toString();
    player.createdAt = new Date().toISOString();
    players.push(player);
    this.savePlayers(players);
    return player;
  }

  static getActivePlayer() {
    const id = this.load(this.KEYS.ACTIVE_PLAYER);
    const players = this.getPlayers();
    return players.find(p => p.id === id) || players[0] || null;
  }

  static setActivePlayer(playerId) {
    this.save(this.KEYS.ACTIVE_PLAYER, playerId);
  }

  static getCoins() {
    return this.load(this.KEYS.COINS, 50);
  }

  static addCoins(amount) {
    const current = this.getCoins();
    this.save(this.KEYS.COINS, current + amount);
    return current + amount;
  }

  static spendCoins(amount) {
    const current = this.getCoins();
    if (current < amount) return false;
    this.save(this.KEYS.COINS, current - amount);
    return true;
  }

  static getSettings() {
    return this.load(this.KEYS.SETTINGS, {
      language: 'de',
      controlMode: 'auto',
      soundVolume: 0.8,
      musicVolume: 0.5,
      graphics: 'high',
    });
  }

  static saveSettings(settings) {
    this.save(this.KEYS.SETTINGS, settings);
  }

  static getStats() {
    return this.load(this.KEYS.STATS, {
      gamesPlayed: 0,
      gamesWon: 0,
      pointsScored: 0,
      totalCoinsEarned: 0,
    });
  }

  static updateStats(update) {
    const stats = this.getStats();
    Object.keys(update).forEach(k => {
      stats[k] = (stats[k] || 0) + update[k];
    });
    this.save(this.KEYS.STATS, stats);
  }

  static getInventory() {
    return this.load(this.KEYS.INVENTORY, []);
  }

  static addToInventory(item) {
    const inv = this.getInventory();
    inv.push({ ...item, id: Date.now().toString() });
    this.save(this.KEYS.INVENTORY, inv);
  }

  static canDailySpin() {
    const lastSpin = this.load(this.KEYS.DAILY_SPIN);
    if (!lastSpin) return true;
    const last = new Date(lastSpin);
    const now = new Date();
    return now.toDateString() !== last.toDateString();
  }

  static recordDailySpin() {
    this.save(this.KEYS.DAILY_SPIN, new Date().toISOString());
  }
}

export default SaveSystem;
