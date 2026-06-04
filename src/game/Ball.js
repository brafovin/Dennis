import * as THREE from 'three';
import { BALL, HOOP, COURT } from '../constants.js';

export class Ball {
  constructor(scene) {
    this.scene = scene;
    this.position = new THREE.Vector3(0, BALL.RADIUS, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.owner = null;
    this.inFlight = false;
    this.onGround = false;
    this.shotTarget = null;
    this.shotTime = 0;
    this.shotDuration = 0;
    this.shotStart = new THREE.Vector3();
    this.shotPeak = new THREE.Vector3();
    this.callbacks = {};
    this._build();
    this._buildTrail();
  }

  _build() {
    const geo = new THREE.SphereGeometry(BALL.RADIUS, 16, 16);
    const texture = this._buildTexture();
    const mat = new THREE.MeshLambertMaterial({ map: texture });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.castShadow = true;
    this.scene.add(this.mesh);
  }

  _buildTexture() {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d');

    // Orange base
    const grad = ctx.createRadialGradient(100, 100, 10, 128, 128, 128);
    grad.addColorStop(0, '#ff8c00');
    grad.addColorStop(0.5, '#e06000');
    grad.addColorStop(1, '#c04000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Black seam lines
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;

    // Horizontal seam
    ctx.beginPath();
    ctx.moveTo(0, 128);
    ctx.bezierCurveTo(64, 90, 192, 90, 256, 128);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 128);
    ctx.bezierCurveTo(64, 166, 192, 166, 256, 128);
    ctx.stroke();

    // Vertical seam
    ctx.beginPath();
    ctx.moveTo(128, 0);
    ctx.bezierCurveTo(90, 64, 90, 192, 128, 256);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(128, 0);
    ctx.bezierCurveTo(166, 64, 166, 192, 128, 256);
    ctx.stroke();

    return new THREE.CanvasTexture(c);
  }

  _buildTrail() {
    const count = 20;
    this.trailPositions = Array(count).fill(null).map(() => new THREE.Vector3());
    this.trailIndex = 0;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 0.3,
      linewidth: 2,
    });
    this.trail = new THREE.Line(geo, mat);
    this.trail.visible = false;
    this.scene.add(this.trail);
  }

  _updateTrail() {
    if (!this.inFlight) { this.trail.visible = false; return; }
    this.trail.visible = true;
    this.trailPositions[this.trailIndex % this.trailPositions.length].copy(this.position);
    this.trailIndex++;

    const posArray = this.trail.geometry.attributes.position.array;
    const count = this.trailPositions.length;
    for (let i = 0; i < count; i++) {
      const idx = (this.trailIndex - count + i + count) % count;
      posArray[i * 3] = this.trailPositions[idx].x;
      posArray[i * 3 + 1] = this.trailPositions[idx].y;
      posArray[i * 3 + 2] = this.trailPositions[idx].z;
    }
    this.trail.geometry.attributes.position.needsUpdate = true;
  }

  on(event, cb) {
    this.callbacks[event] = cb;
  }

  _emit(event, data) {
    if (this.callbacks[event]) this.callbacks[event](data);
  }

  attachToPlayer(player, offset = null) {
    this.owner = player;
    this.inFlight = false;
    this.onGround = false;
  }

  detachFromPlayer() {
    this.owner = null;
  }

  shoot(from, target, power = 1.0, accuracy = 1.0) {
    this.owner = null;
    this.inFlight = true;
    this.onGround = false;
    this.shotStart.copy(from);
    this.shotTarget = target.clone();
    this.shotTime = 0;

    const dist = from.distanceTo(target);
    this.shotDuration = 0.4 + dist * 0.06;

    // Arc peak based on distance and power
    const peakHeight = from.y + 2.5 + dist * 0.15 * power;
    this.shotPeak.set(
      (from.x + target.x) / 2 + (Math.random() - 0.5) * (1 - accuracy) * 0.5,
      peakHeight,
      (from.z + target.z) / 2,
    );

    this.shotAccuracy = accuracy;
    this.position.copy(from);
    this.mesh.position.copy(from);
  }

  bounce(position, velocity) {
    this.owner = null;
    this.inFlight = false;
    this.onGround = false;
    this.position.copy(position);
    this.velocity.copy(velocity);
  }

  update(delta) {
    if (this.owner) {
      // Ball follows player
      const offset = new THREE.Vector3(0.3, 0.9, 0.4);
      const playerDir = new THREE.Vector3(
        Math.sin(this.owner.rotation),
        0,
        Math.cos(this.owner.rotation),
      );
      const right = new THREE.Vector3().crossVectors(playerDir, new THREE.Vector3(0, 1, 0)).normalize();

      this.position.copy(this.owner.position)
        .addScaledVector(right, offset.x)
        .addScaledVector(new THREE.Vector3(0, 1, 0), offset.y)
        .addScaledVector(playerDir, -offset.z);

      // Dribble bounce animation
      if (this.owner.isDribbling || this.owner.isMoving) {
        const bounceFreq = 8 + (this.owner.speed || 0) * 0.5;
        const bounceAmp = 0.15;
        const phase = (Date.now() / 1000) * bounceFreq;
        this.position.y = this.owner.position.y + 0.2 + Math.abs(Math.sin(phase)) * bounceAmp;
      }

      this.mesh.position.copy(this.position);
      return;
    }

    if (this.inFlight && this.shotTarget) {
      this.shotTime += delta;
      const t = Math.min(this.shotTime / this.shotDuration, 1);

      // Quadratic bezier arc: start -> peak -> target
      const inv = 1 - t;
      this.position.x = inv * inv * this.shotStart.x + 2 * inv * t * this.shotPeak.x + t * t * this.shotTarget.x;
      this.position.y = inv * inv * this.shotStart.y + 2 * inv * t * this.shotPeak.y + t * t * this.shotTarget.y;
      this.position.z = inv * inv * this.shotStart.z + 2 * inv * t * this.shotPeak.z + t * t * this.shotTarget.z;

      this.mesh.rotation.x += delta * 6;
      this.mesh.rotation.z += delta * 3;

      if (t >= 1) {
        this.inFlight = false;
        this._checkBasketCollision();
      }

      this.mesh.position.copy(this.position);
      this._updateTrail();
      return;
    }

    if (!this.onGround) {
      // Physics
      this.velocity.y -= 18 * delta;
      this.position.addScaledVector(this.velocity, delta);

      // Floor bounce
      if (this.position.y <= BALL.RADIUS) {
        this.position.y = BALL.RADIUS;
        this.velocity.y *= -0.65;
        this.velocity.x *= 0.85;
        this.velocity.z *= 0.85;

        if (Math.abs(this.velocity.y) < 0.3) {
          this.velocity.y = 0;
          this.onGround = true;
        }
        this._emit('bounce', this.position);
      }

      // Wall bounds
      const W = COURT.WIDTH / 2 + 3;
      const L = COURT.LENGTH / 2 + 3;
      if (Math.abs(this.position.x) > W) {
        this.position.x = Math.sign(this.position.x) * W;
        this.velocity.x *= -0.6;
      }
      if (Math.abs(this.position.z) > L) {
        this.position.z = Math.sign(this.position.z) * L;
        this.velocity.z *= -0.6;
      }
    }

    this.mesh.position.copy(this.position);
    this._updateTrail();
  }

  _checkBasketCollision() {
    const rims = [
      { z: COURT.LENGTH / 2 - HOOP.OVERHANG + 0.08 + HOOP.RIM_RADIUS, side: 1 },
      { z: -(COURT.LENGTH / 2 - HOOP.OVERHANG + 0.08 + HOOP.RIM_RADIUS), side: -1 },
    ];

    for (const rim of rims) {
      const dx = this.position.x;
      const dy = this.position.y - HOOP.HEIGHT;
      const dz = this.position.z - rim.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (Math.abs(dy) < 0.3 && dist < HOOP.RIM_RADIUS * 1.2) {
        if (this.shotAccuracy >= 0.7 && dist < HOOP.RIM_RADIUS * 0.9) {
          // BASKET!
          this._emit('basket', { side: rim.side, position: this.position.clone() });
          this.velocity.set(
            (Math.random() - 0.5) * 2,
            -3,
            rim.side * -2,
          );
          this.onGround = false;
          return;
        } else {
          // Rim hit
          this.velocity.set(
            (Math.random() - 0.5) * 3,
            3,
            rim.side * -2 + (Math.random() - 0.5),
          );
          this.onGround = false;
          this._emit('rimHit', this.position.clone());
          return;
        }
      }
    }

    // Miss - falls to ground
    this.velocity.set((Math.random() - 0.5) * 2, -1, (Math.random() - 0.5) * 2);
    this.onGround = false;
  }

  isNearPlayer(playerPosition, maxDist = 1.2) {
    return this.position.distanceTo(playerPosition) < maxDist;
  }
}

export default Ball;
