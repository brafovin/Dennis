import * as THREE from 'three';
import { COURT, HOOP } from '../constants.js';

export class Court {
  constructor(scene) {
    this.scene = scene;
    this.meshes = [];
    this._build();
  }

  _build() {
    this._createFloor();
    this._createWalls();
    this._createLines();
    this._createHoop(1);
    this._createHoop(-1);
    this._createBleachers();
    this._createLighting();
    this._createCeiling();
  }

  _createFloor() {
    const texture = this._buildFloorTexture();
    const geo = new THREE.PlaneGeometry(COURT.WIDTH, COURT.LENGTH, 1, 1);
    const mat = new THREE.MeshLambertMaterial({ map: texture });
    const floor = new THREE.Mesh(geo, mat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.meshes.push(floor);

    // Out-of-bounds floor
    const outerGeo = new THREE.PlaneGeometry(40, 50);
    const outerMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
    const outer = new THREE.Mesh(outerGeo, outerMat);
    outer.rotation.x = -Math.PI / 2;
    outer.position.y = -0.01;
    this.scene.add(outer);
  }

  _buildFloorTexture() {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 2048;
    const ctx = c.getContext('2d');

    // Wood base
    const gradient = ctx.createLinearGradient(0, 0, 1024, 0);
    gradient.addColorStop(0, '#c8903a');
    gradient.addColorStop(0.5, '#e8aa50');
    gradient.addColorStop(1, '#c8903a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 2048);

    // Wood planks
    const plankW = 1024 / 14;
    for (let i = 0; i <= 14; i++) {
      ctx.strokeStyle = '#a07030';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(i * plankW, 0);
      ctx.lineTo(i * plankW, 2048);
      ctx.stroke();

      // Grain lines
      for (let j = 0; j < 8; j++) {
        const x = i * plankW + (j / 8) * plankW;
        ctx.strokeStyle = 'rgba(140,90,30,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + Math.random() * 4 - 2, 0);
        ctx.lineTo(x + Math.random() * 4 - 2, 2048);
        ctx.stroke();
      }
    }

    // Court lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;

    const px = (v) => ((v + COURT.WIDTH / 2) / COURT.WIDTH) * 1024;
    const py = (v) => ((v + COURT.LENGTH / 2) / COURT.LENGTH) * 2048;

    const W = COURT.WIDTH;
    const L = COURT.LENGTH;

    // Boundary
    ctx.strokeRect(px(-W/2) + 3, py(-L/2) + 3, 1024 - 6, 2048 - 6);

    // Center line
    ctx.beginPath();
    ctx.moveTo(0, py(0));
    ctx.lineTo(1024, py(0));
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(512, py(0), (COURT.CENTER_RADIUS / W) * 1024, 0, Math.PI * 2);
    ctx.stroke();

    // Paint areas both ends
    [-1, 1].forEach(side => {
      const baseY = side > 0 ? py(L/2 - COURT.PAINT_LENGTH) : py(-L/2);
      const rectH = (COURT.PAINT_LENGTH / L) * 2048;
      const paintX = px(-COURT.PAINT_WIDTH / 2);
      const paintW = (COURT.PAINT_WIDTH / W) * 1024;

      ctx.strokeRect(paintX, baseY, paintW, rectH);

      // Free throw circle
      const ftY = side > 0 ? py(L/2 - COURT.PAINT_LENGTH) : py(-L/2 + COURT.PAINT_LENGTH);
      ctx.beginPath();
      ctx.arc(512, ftY, (1.8 / W) * 1024, 0, Math.PI * 2);
      ctx.stroke();
    });

    // 3-point lines
    [-1, 1].forEach(side => {
      const centerY = side > 0 ? py(L/2 - 1.575) : py(-L/2 + 1.575);
      const radius = (COURT.THREE_POINT_RADIUS / W) * 1024;
      ctx.beginPath();
      ctx.arc(512, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Straight parts of 3-point line
      const sideLineY1 = side > 0 ? py(L/2) : py(-L/2);
      const sideLineY2 = side > 0 ? py(L/2 - 3) : py(-L/2 + 3);
      const leftX = px(-W/2 + 0.9);
      const rightX = px(W/2 - 0.9);

      ctx.beginPath();
      ctx.moveTo(leftX, sideLineY1);
      ctx.lineTo(leftX, sideLineY2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(rightX, sideLineY1);
      ctx.lineTo(rightX, sideLineY2);
      ctx.stroke();
    });

    return new THREE.CanvasTexture(c);
  }

  _createWalls() {
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x2244aa });
    const wallH = 8;

    const walls = [
      { w: COURT.WIDTH + 4, h: wallH, x: 0, z: -(COURT.LENGTH / 2 + 2), ry: 0 },
      { w: COURT.WIDTH + 4, h: wallH, x: 0, z: (COURT.LENGTH / 2 + 2), ry: Math.PI },
      { w: COURT.LENGTH + 4, h: wallH, x: -(COURT.WIDTH / 2 + 2), z: 0, ry: Math.PI / 2 },
      { w: COURT.LENGTH + 4, h: wallH, x: (COURT.WIDTH / 2 + 2), z: 0, ry: -Math.PI / 2 },
    ];

    walls.forEach(w => {
      const geo = new THREE.PlaneGeometry(w.w, w.h);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(w.x, wallH / 2, w.z);
      mesh.rotation.y = w.ry;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    });
  }

  _createCeiling() {
    const geo = new THREE.PlaneGeometry(40, 50);
    const mat = new THREE.MeshLambertMaterial({ color: 0x111133, side: THREE.DoubleSide });
    const ceiling = new THREE.Mesh(geo, mat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 9;
    this.scene.add(ceiling);
  }

  _createLines() {
    // Boundary lines (3D raised slightly to avoid z-fighting)
  }

  _createHoop(side) {
    const hoopGroup = new THREE.Group();
    const W2 = COURT.LENGTH / 2 - HOOP.OVERHANG;

    // Pole
    const poleGeo = new THREE.CylinderGeometry(HOOP.POLE_RADIUS, HOOP.POLE_RADIUS, HOOP.HEIGHT, 8);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = HOOP.HEIGHT / 2;
    pole.castShadow = true;
    hoopGroup.add(pole);

    // Backboard
    const bbGeo = new THREE.BoxGeometry(HOOP.BACKBOARD_WIDTH, HOOP.BACKBOARD_HEIGHT, HOOP.BACKBOARD_THICKNESS);
    const bbMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    const bb = new THREE.Mesh(bbGeo, bbMat);
    bb.position.set(0, HOOP.HEIGHT + HOOP.BACKBOARD_HEIGHT / 2 + 0.1, -side * 0.08);
    bb.castShadow = true;
    hoopGroup.add(bb);

    // Backboard box (square in center)
    const boxGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.59, 0.45, 0.01));
    const boxLine = new THREE.LineSegments(boxGeo, new THREE.LineBasicMaterial({ color: 0xff4400 }));
    boxLine.position.copy(bb.position);
    boxLine.position.z -= side * 0.04;
    hoopGroup.add(boxLine);

    // Rim
    const rimGeo = new THREE.TorusGeometry(HOOP.RIM_RADIUS, 0.018, 8, 24);
    const rimMat = new THREE.MeshLambertMaterial({ color: 0xff4400 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, HOOP.HEIGHT, side * (0.08 + HOOP.RIM_RADIUS));
    rim.castShadow = true;
    hoopGroup.add(rim);

    // Net
    const netGroup = this._buildNet(rim.position);
    hoopGroup.add(netGroup);

    // Arm connecting pole to backboard
    const armGeo = new THREE.BoxGeometry(0.05, 0.05, 0.6);
    const arm = new THREE.Mesh(armGeo, poleMat);
    arm.position.set(0, HOOP.HEIGHT + 0.2, -side * 0.3);
    hoopGroup.add(arm);

    hoopGroup.position.set(0, 0, side * W2);

    // Store rim position for collision detection
    this[side > 0 ? 'rimTop' : 'rimBottom'] = {
      position: new THREE.Vector3(0, HOOP.HEIGHT, side * W2 + side * (0.08 + HOOP.RIM_RADIUS)),
      radius: HOOP.RIM_RADIUS,
    };

    this.scene.add(hoopGroup);
  }

  _buildNet(rimPos) {
    const group = new THREE.Group();
    const segments = 8;
    const netHeight = 0.45;
    const topRadius = HOOP.RIM_RADIUS;
    const bottomRadius = HOOP.RIM_RADIUS * 0.4;
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });

    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const nextAngle = ((i + 1) / segments) * Math.PI * 2;
      const points = [];
      const steps = 6;
      for (let j = 0; j <= steps; j++) {
        const t = j / steps;
        const r = topRadius + (bottomRadius - topRadius) * t;
        const lerpAngle = angle + (nextAngle - angle) * 0.5;
        const x = rimPos.x + r * Math.cos(lerpAngle);
        const z = rimPos.z + r * Math.sin(lerpAngle);
        const y = rimPos.y - t * netHeight;
        points.push(new THREE.Vector3(x, y, z));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      group.add(new THREE.Line(geo, lineMat));
    }

    // Horizontal rings
    for (let j = 0; j <= 3; j++) {
      const t = j / 3;
      const r = topRadius + (bottomRadius - topRadius) * t;
      const y = rimPos.y - t * netHeight;
      const ringPoints = [];
      for (let i = 0; i <= 32; i++) {
        const a = (i / 32) * Math.PI * 2;
        ringPoints.push(new THREE.Vector3(rimPos.x + r * Math.cos(a), y, rimPos.z + r * Math.sin(a)));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(ringPoints);
      group.add(new THREE.Line(geo, lineMat));
    }

    return group;
  }

  _createBleachers() {
    const bleacherMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    const seatMat = new THREE.MeshLambertMaterial({ color: 0x2266aa });

    const sides = [
      { axis: 'x', sign: 1, pos: COURT.WIDTH / 2 + 4 },
      { axis: 'x', sign: -1, pos: -(COURT.WIDTH / 2 + 4) },
    ];

    sides.forEach(({ axis, sign, pos }) => {
      for (let row = 0; row < 8; row++) {
        const rowDepth = sign * (row + 0.5) * 1.2;
        const rowHeight = row * 0.4 + 0.4;

        const riserGeo = new THREE.BoxGeometry(0.1, row * 0.4 + 0.4, COURT.LENGTH + 4);
        const riser = new THREE.Mesh(riserGeo, bleacherMat);
        if (axis === 'x') {
          riser.position.set(pos + rowDepth, rowHeight / 2, 0);
        }
        riser.receiveShadow = true;
        this.scene.add(riser);

        // Seats (simplified as small boxes)
        const numSeats = Math.floor((COURT.LENGTH + 4) / 1.2);
        for (let s = 0; s < numSeats; s++) {
          const seatGeo = new THREE.BoxGeometry(0.9, 0.1, 0.7);
          const seat = new THREE.Mesh(seatGeo, seatMat);
          if (axis === 'x') {
            seat.position.set(pos + rowDepth + sign * 0.3, rowHeight + 0.05, -COURT.LENGTH / 2 - 2 + s * 1.2 + 0.6);
          }
          this.scene.add(seat);

          // Simple crowd person
          if (Math.random() > 0.2) {
            const personGeo = new THREE.CylinderGeometry(0.25, 0.2, 1.2, 5);
            const personMat = new THREE.MeshLambertMaterial({
              color: new THREE.Color().setHSL(Math.random(), 0.6, 0.5),
            });
            const person = new THREE.Mesh(personGeo, personMat);
            if (axis === 'x') {
              person.position.set(pos + rowDepth + sign * 0.3, rowHeight + 0.65, -COURT.LENGTH / 2 - 2 + s * 1.2 + 0.6);
            }
            this.scene.add(person);
          }
        }
      }
    });
  }

  _createLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);

    const spotPositions = [
      [-6, 8, -10], [6, 8, -10], [-6, 8, 10], [6, 8, 10],
    ];

    spotPositions.forEach(([x, y, z]) => {
      const spot = new THREE.SpotLight(0xffffff, 1.5, 30, Math.PI / 4, 0.3, 1);
      spot.position.set(x, y, z);
      spot.target.position.set(0, 0, 0);
      spot.castShadow = true;
      spot.shadow.mapSize.width = 512;
      spot.shadow.mapSize.height = 512;
      this.scene.add(spot);
      this.scene.add(spot.target);

      // Lamp box
      const lampGeo = new THREE.BoxGeometry(0.8, 0.3, 0.8);
      const lampMat = new THREE.MeshLambertMaterial({ color: 0xffffcc, emissive: 0xffffcc, emissiveIntensity: 0.5 });
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(x, y + 0.2, z);
      this.scene.add(lamp);
    });
  }

  getRimPositions() {
    return [
      { position: new THREE.Vector3(0, HOOP.HEIGHT, COURT.LENGTH / 2 - HOOP.OVERHANG + 0.08 + HOOP.RIM_RADIUS), side: 1 },
      { position: new THREE.Vector3(0, HOOP.HEIGHT, -(COURT.LENGTH / 2 - HOOP.OVERHANG + 0.08 + HOOP.RIM_RADIUS)), side: -1 },
    ];
  }

  isInThreePointRange(position, attackingSign) {
    const rimZ = attackingSign * (COURT.LENGTH / 2 - HOOP.OVERHANG + 0.08 + HOOP.RIM_RADIUS);
    const dx = position.x;
    const dz = position.z - rimZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    return dist > COURT.THREE_POINT_RADIUS;
  }

  isOutOfBounds(position) {
    return (
      Math.abs(position.x) > COURT.WIDTH / 2 + 0.3 ||
      Math.abs(position.z) > COURT.LENGTH / 2 + 0.3
    );
  }
}

export default Court;
