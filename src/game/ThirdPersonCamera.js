import * as THREE from 'three';

export class ThirdPersonCamera {
  constructor(camera) {
    this.camera = camera;
    this.target = null;
    this.idealOffset = new THREE.Vector3(0, 4, 7);
    this.idealLookAt = new THREE.Vector3(0, 1, 0);
    this.currentPos = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();
    this.smoothFactor = 0.1;
    this.mouseYaw = 0;
    this.mousePitch = 0.3;
    this.maxPitch = Math.PI / 3;
    this.minPitch = -0.1;
  }

  setTarget(player) {
    this.target = player;
    if (player) {
      this.currentPos.copy(player.position).add(this.idealOffset);
      this.currentLookAt.copy(player.position).add(this.idealLookAt);
      this.camera.position.copy(this.currentPos);
      this.camera.lookAt(this.currentLookAt);
    }
  }

  onMouseMove(dx, dy) {
    this.mouseYaw -= dx * 0.003;
    this.mousePitch -= dy * 0.003;
    this.mousePitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.mousePitch));
  }

  update(delta) {
    if (!this.target) return;

    const dist = 7;
    const height = 3 + this.mousePitch * 3;

    // Camera orbit around player
    const offsetX = Math.sin(this.mouseYaw) * dist;
    const offsetZ = Math.cos(this.mouseYaw) * dist;

    const targetPos = new THREE.Vector3(
      this.target.position.x + offsetX,
      this.target.position.y + height,
      this.target.position.z + offsetZ,
    );

    const lookAtPos = new THREE.Vector3(
      this.target.position.x,
      this.target.position.y + 1.2,
      this.target.position.z,
    );

    const lerpSpeed = 1 - Math.pow(0.01, delta);
    this.currentPos.lerp(targetPos, lerpSpeed);
    this.currentLookAt.lerp(lookAtPos, lerpSpeed);

    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLookAt);
  }

  setTopDown() {
    if (!this.target) return;
    this.camera.position.set(this.target.position.x, 20, this.target.position.z);
    this.camera.lookAt(this.target.position.x, 0, this.target.position.z);
  }
}

export default ThirdPersonCamera;
