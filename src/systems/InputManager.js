export class InputManager {
  constructor() {
    this.keys = {};
    this.mouse = { x: 0, y: 0, dx: 0, dy: 0, buttons: {} };
    this.touch = { active: false, x: 0, y: 0, startX: 0, startY: 0 };
    this.gamepad = null;
    this.mode = 'manual';
    this.listeners = {};

    this._bindEvents();
    this._pollGamepad();
  }

  _bindEvents() {
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      this._emit('keydown', e.code);
    });
    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
      this._emit('keyup', e.code);
    });

    window.addEventListener('mousemove', e => {
      this.mouse.dx = e.movementX;
      this.mouse.dy = e.movementY;
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    window.addEventListener('mousedown', e => {
      this.mouse.buttons[e.button] = true;
      this._emit('mousedown', e.button);
    });
    window.addEventListener('mouseup', e => {
      this.mouse.buttons[e.button] = false;
      this._emit('mouseup', e.button);
    });

    // Touch support
    window.addEventListener('touchstart', e => {
      const t = e.touches[0];
      this.touch = { active: true, x: t.clientX, y: t.clientY, startX: t.clientX, startY: t.clientY };
    }, { passive: true });
    window.addEventListener('touchmove', e => {
      const t = e.touches[0];
      this.touch.x = t.clientX;
      this.touch.y = t.clientY;
    }, { passive: true });
    window.addEventListener('touchend', () => {
      this.touch.active = false;
    });

    window.addEventListener('gamepadconnected', e => {
      this.gamepad = e.gamepad;
    });
    window.addEventListener('gamepaddisconnected', () => {
      this.gamepad = null;
    });
  }

  _pollGamepad() {
    const poll = () => {
      const pads = navigator.getGamepads?.();
      if (pads) {
        for (const pad of pads) {
          if (pad) { this.gamepad = pad; break; }
        }
      }
      requestAnimationFrame(poll);
    };
    requestAnimationFrame(poll);
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  _emit(event, data) {
    (this.listeners[event] || []).forEach(cb => cb(data));
  }

  isDown(code) {
    return !!this.keys[code];
  }

  getMovement() {
    let x = 0;
    let z = 0;

    if (this.isDown('KeyA') || this.isDown('ArrowLeft')) x -= 1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) x += 1;
    if (this.isDown('KeyW') || this.isDown('ArrowUp')) z -= 1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) z += 1;

    // Gamepad left stick
    if (this.gamepad) {
      const ax = this.gamepad.axes[0];
      const ay = this.gamepad.axes[1];
      if (Math.abs(ax) > 0.1) x += ax;
      if (Math.abs(ay) > 0.1) z += ay;
    }

    const len = Math.sqrt(x * x + z * z);
    if (len > 1) { x /= len; z /= len; }

    return { x, z };
  }

  isShooting() {
    return this.isDown('Space') ||
      !!this.mouse.buttons[0] ||
      this._gamepadButton(0);
  }

  isPassing() {
    return this.isDown('KeyE') || this._gamepadButton(2);
  }

  isSprinting() {
    return this.isDown('ShiftLeft') || this.isDown('ShiftRight') || this._gamepadButton(10);
  }

  isDribbling() {
    return this.isDown('KeyQ') || this._gamepadButton(1);
  }

  isDefending() {
    return this.isDown('KeyF') || this._gamepadButton(3);
  }

  isSpinMove() {
    return this.isDown('KeyR') || this._gamepadButton(4);
  }

  _gamepadButton(index) {
    return this.gamepad?.buttons[index]?.pressed || false;
  }

  resetMouse() {
    this.mouse.dx = 0;
    this.mouse.dy = 0;
  }

  setControlMode(mode) {
    this.mode = mode;
  }
}

export const inputManager = new InputManager();
export default inputManager;
