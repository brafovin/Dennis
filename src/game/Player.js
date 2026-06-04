import * as THREE from 'three';
import { PLAYER, COURT } from '../constants.js';

export class Player {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.id = config.id || Math.random().toString(36).slice(2);
    this.name = config.name || 'Player';
    this.number = config.number || 23;
    this.team = config.team || 0;
    this.isLocalPlayer = config.isLocalPlayer || false;
    this.controlMode = config.controlMode || 'auto';

    // Colors
    this.skinColor = config.skinColor || '#c68642';
    this.jerseyColor = config.jerseyColor || '#0000ff';
    this.shortsColor = config.shortsColor || '#0000aa';
    this.shoeColor = config.shoeColor || '#111111';

    // Skills (1-99)
    this.skills = {
      speed: config.skills?.speed || 75,
      shooting: config.skills?.shooting || 75,
      dribbling: config.skills?.dribbling || 75,
      passing: config.skills?.passing || 75,
      defense: config.skills?.defense || 75,
    };

    // State
    this.position = new THREE.Vector3(config.startX || 0, 0, config.startZ || 0);
    this.rotation = 0;
    this.velocity = new THREE.Vector3();
    this.hasBall = false;
    this.isMoving = false;
    this.isDribbling = false;
    this.isShooting = false;
    this.isJumping = false;
    this.jumpY = 0;
    this.jumpVelocity = 0;
    this.isDefending = false;
    this.shootPower = 0;
    this.isChargingShot = false;
    this.speed = 0;

    this.fouls = 0;
    this.points = 0;
    this.rebounds = 0;
    this.assists = 0;

    this._build();
    this._buildLabel();
  }

  _build() {
    this.group = new THREE.Group();
    this.scene.add(this.group);

    const skinMat = new THREE.MeshLambertMaterial({ color: this.skinColor });
    const jerseyMat = new THREE.MeshLambertMaterial({ color: this.jerseyColor });
    const shortsMat = new THREE.MeshLambertMaterial({ color: this.shortsColor });
    const shoeMat = new THREE.MeshLambertMaterial({ color: this.shoeColor });

    // Body (torso)
    const bodyGeo = new THREE.BoxGeometry(0.45, 0.55, 0.25);
    this.bodyMesh = new THREE.Mesh(bodyGeo, jerseyMat);
    this.bodyMesh.position.y = 1.05;
    this.bodyMesh.castShadow = true;
    this.group.add(this.bodyMesh);

    // Jersey number
    this._addJerseyNumber();

    // Head
    const headGeo = new THREE.SphereGeometry(0.18, 8, 8);
    this.headMesh = new THREE.Mesh(headGeo, skinMat);
    this.headMesh.position.y = 1.65;
    this.headMesh.castShadow = true;
    this.group.add(this.headMesh);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.03, 6, 6);
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.07, 1.67, 0.16);
    eyeR.position.set(0.07, 1.67, 0.16);
    this.group.add(eyeL, eyeR);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.18, 0.55, 0.18);
    this.legL = new THREE.Mesh(legGeo, shortsMat);
    this.legR = new THREE.Mesh(legGeo, shortsMat);
    this.legL.position.set(-0.12, 0.57, 0);
    this.legR.position.set(0.12, 0.57, 0);
    this.legL.castShadow = true;
    this.legR.castShadow = true;
    this.group.add(this.legL, this.legR);

    // Lower legs
    const lowerGeo = new THREE.BoxGeometry(0.15, 0.45, 0.15);
    this.lowerL = new THREE.Mesh(lowerGeo, shortsMat);
    this.lowerR = new THREE.Mesh(lowerGeo, shortsMat);
    this.lowerL.position.set(-0.12, 0.26, 0);
    this.lowerR.position.set(0.12, 0.26, 0);
    this.group.add(this.lowerL, this.lowerR);

    // Shoes
    const shoeGeo = new THREE.BoxGeometry(0.18, 0.1, 0.24);
    const shoeL = new THREE.Mesh(shoeGeo, shoeMat);
    const shoeR = new THREE.Mesh(shoeGeo, shoeMat);
    shoeL.position.set(-0.12, 0.05, 0.03);
    shoeR.position.set(0.12, 0.05, 0.03);
    this.group.add(shoeL, shoeR);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.12, 0.45, 0.12);
    this.armL = new THREE.Mesh(armGeo, skinMat);
    this.armR = new THREE.Mesh(armGeo, skinMat);
    this.armL.position.set(-0.29, 0.95, 0);
    this.armR.position.set(0.29, 0.95, 0);
    this.armL.castShadow = true;
    this.armR.castShadow = true;
    this.group.add(this.armL, this.armR);

    // Forearms
    const forearmGeo = new THREE.BoxGeometry(0.10, 0.38, 0.10);
    this.forearmL = new THREE.Mesh(forearmGeo, skinMat);
    this.forearmR = new THREE.Mesh(forearmGeo, skinMat);
    this.forearmL.position.set(-0.29, 0.58, 0);
    this.forearmR.position.set(0.29, 0.58, 0);
    this.group.add(this.forearmL, this.forearmR);

    // Team color band on arm
    const bandGeo = new THREE.TorusGeometry(0.07, 0.02, 4, 8);
    const bandMat = new THREE.MeshLambertMaterial({ color: this.team === 0 ? 0xff0000 : 0x00aa00 });
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.rotation.x = Math.PI / 2;
    band.position.set(-0.29, 0.9, 0);
    this.group.add(band);

    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotation;

    // Shadow indicator circle
    const shadowGeo = new THREE.CircleGeometry(0.3, 12);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25 });
    this.shadowCircle = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowCircle.rotation.x = -Math.PI / 2;
    this.shadowCircle.position.y = 0.01;
    this.scene.add(this.shadowCircle);

    // Selection ring for local player
    if (this.isLocalPlayer) {
      const ringGeo = new THREE.TorusGeometry(0.35, 0.03, 4, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      this.selectionRing = new THREE.Mesh(ringGeo, ringMat);
      this.selectionRing.rotation.x = Math.PI / 2;
      this.selectionRing.position.y = 0.02;
      this.group.add(this.selectionRing);
    }
  }

  _addJerseyNumber() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = this.jerseyColor;
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(this.number), 32, 32);
    const texture = new THREE.CanvasTexture(canvas);
    const numGeo = new THREE.PlaneGeometry(0.25, 0.25);
    const numMat = new THREE.MeshLambertMaterial({ map: texture, transparent: true });
    const numMesh = new THREE.Mesh(numGeo, numMat);
    numMesh.position.set(0, 1.05, 0.13);
    this.group.add(numMesh);
  }

  _buildLabel() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.roundRect?.(0, 0, 256, 64, 8) || ctx.fillRect(0, 0, 256, 64);
    ctx.fill?.();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.name, 128, 32);
    const texture = new THREE.CanvasTexture(canvas);
    const labelGeo = new THREE.PlaneGeometry(1.0, 0.25);
    const labelMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthTest: false });
    this.label = new THREE.Mesh(labelGeo, labelMat);
    this.label.position.set(0, 2.1, 0);
    this.label.renderOrder = 999;
    this.group.add(this.label);
  }

  _animate(delta) {
    const speed = this.velocity.length();
    this.speed = speed;
    this.isMoving = speed > 0.1;

    if (this.isMoving) {
      const freq = speed * 2.5;
      const t = Date.now() / 1000 * freq;

      // Leg swing
      this.legL.rotation.x = Math.sin(t) * 0.4;
      this.legR.rotation.x = Math.sin(t + Math.PI) * 0.4;
      this.lowerL.rotation.x = Math.max(0, Math.sin(t + 0.3) * 0.3);
      this.lowerR.rotation.x = Math.max(0, Math.sin(t + Math.PI + 0.3) * 0.3);

      // Arm swing
      this.armL.rotation.x = Math.sin(t + Math.PI) * 0.3;
      this.armR.rotation.x = Math.sin(t) * 0.3;

      // Body bob
      this.bodyMesh.position.y = 1.05 + Math.abs(Math.sin(t * 2)) * 0.02;
    } else {
      const neutral = 0;
      this.legL.rotation.x += (neutral - this.legL.rotation.x) * 0.2;
      this.legR.rotation.x += (neutral - this.legR.rotation.x) * 0.2;
      this.armL.rotation.x += (neutral - this.armL.rotation.x) * 0.2;
      this.armR.rotation.x += (neutral - this.armR.rotation.x) * 0.2;
    }

    // Shooting animation
    if (this.isShooting || this.isChargingShot) {
      this.armR.rotation.x = -1.2 - this.shootPower * 0.5;
      this.forearmR.rotation.x = -0.8;
    }

    // Jumping
    if (this.isJumping) {
      this.legL.rotation.x = -0.3;
      this.legR.rotation.x = -0.3;
    }

    // Label always faces camera
    if (this.label) {
      this.label.rotation.y = -this.group.rotation.y;
    }
  }

  update(delta, input) {
    if (!this.isLocalPlayer || !input) {
      this._animate(delta);
      this._updatePosition();
      return;
    }

    const move = input.getMovement();
    const hasMoved = Math.abs(move.x) > 0.01 || Math.abs(move.z) > 0.01;

    const isSprinting = input.isSprinting();
    const maxSpeed = isSprinting
      ? (PLAYER.SPRINT_SPEED * (this.skills.speed / 75))
      : hasMoved
        ? (PLAYER.RUN_SPEED * (this.skills.speed / 75))
        : 0;

    if (hasMoved) {
      const targetRot = Math.atan2(move.x, move.z);
      const rotDiff = targetRot - this.rotation;
      const rotNorm = ((rotDiff + Math.PI) % (Math.PI * 2)) - Math.PI;
      this.rotation += rotNorm * Math.min(1, delta * 12);

      this.velocity.x += (move.x * maxSpeed - this.velocity.x) * Math.min(1, delta * 10);
      this.velocity.z += (move.z * maxSpeed - this.velocity.z) * Math.min(1, delta * 10);
    } else {
      this.velocity.x *= Math.max(0, 1 - delta * 8);
      this.velocity.z *= Math.max(0, 1 - delta * 8);
    }

    // Jump
    if (input.isDown('Space') && !this.isJumping) {
      if (this.controlMode === 'manual' || !this.hasBall) {
        this.isJumping = true;
        this.jumpVelocity = Math.sqrt(2 * 9.8 * PLAYER.JUMP_HEIGHT);
      }
    }

    if (this.isJumping) {
      this.jumpVelocity -= 9.8 * delta * 2;
      this.jumpY += this.jumpVelocity * delta;
      if (this.jumpY <= 0) {
        this.jumpY = 0;
        this.isJumping = false;
        this.jumpVelocity = 0;
      }
    }

    // Shot charging (manual mode)
    if (this.controlMode === 'manual' && this.hasBall) {
      if (input.isShooting() && !this.isChargingShot) {
        this.isChargingShot = true;
        this.shootPower = 0;
      }
      if (this.isChargingShot) {
        this.shootPower = Math.min(1, this.shootPower + delta * 1.8);
      }
    }

    this.isDribbling = this.hasBall && (this.isMoving || input.isDribbling());

    this.position.addScaledVector(this.velocity, delta);

    // Court bounds
    this.position.x = Math.max(-COURT.WIDTH / 2 + 0.3, Math.min(COURT.WIDTH / 2 - 0.3, this.position.x));
    this.position.z = Math.max(-COURT.LENGTH / 2 + 0.3, Math.min(COURT.LENGTH / 2 - 0.3, this.position.z));

    this._animate(delta);
    this._updatePosition();
  }

  _updatePosition() {
    this.group.position.x = this.position.x;
    this.group.position.y = this.jumpY;
    this.group.position.z = this.position.z;
    this.group.rotation.y = this.rotation;

    this.shadowCircle.position.x = this.position.x;
    this.shadowCircle.position.z = this.position.z;
  }

  releaseShot() {
    const power = this.shootPower;
    this.shootPower = 0;
    this.isChargingShot = false;
    this.isShooting = false;
    return power;
  }

  getFacingDirection() {
    return new THREE.Vector3(Math.sin(this.rotation), 0, Math.cos(this.rotation));
  }

  getShootPosition() {
    return new THREE.Vector3(
      this.position.x + Math.sin(this.rotation) * 0.3,
      1.8 + this.jumpY,
      this.position.z + Math.cos(this.rotation) * 0.3,
    );
  }

  destroy() {
    this.scene.remove(this.group);
    this.scene.remove(this.shadowCircle);
  }
}

export default Player;
