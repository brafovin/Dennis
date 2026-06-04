import * as THREE from 'three';
import { PLAYER, COURT, HOOP } from '../constants.js';

export class AIPlayer {
  constructor(player, team, gameManager) {
    this.player = player;
    this.team = team;
    this.gm = gameManager;

    this.state = 'idle';
    this.thinkTimer = 0;
    this.thinkInterval = 0.3 + Math.random() * 0.2;
    this.target = new THREE.Vector3();
    this.decisionCooldown = 0;
  }

  update(delta, ball, opponents, teammates) {
    this.thinkTimer += delta;
    this.decisionCooldown = Math.max(0, this.decisionCooldown - delta);

    if (this.thinkTimer >= this.thinkInterval) {
      this.thinkTimer = 0;
      this._think(ball, opponents, teammates);
    }

    this._execute(delta, ball, opponents, teammates);
  }

  _think(ball, opponents, teammates) {
    const p = this.player;

    if (p.hasBall) {
      const distToBasket = this._distToBasket();
      const shootChance = this._shootChance(distToBasket);

      if (shootChance > 0.6 && this.decisionCooldown <= 0) {
        this.state = 'shooting';
        this.decisionCooldown = 1.5;
      } else if (distToBasket > 6 && teammates.length > 0) {
        const bestMate = this._findOpenTeammate(teammates, opponents);
        if (bestMate && Math.random() < 0.4) {
          this.state = 'passing';
          this.passTarget = bestMate;
          this.decisionCooldown = 1.0;
        } else {
          this.state = 'driving';
        }
      } else {
        this.state = 'driving';
      }
    } else {
      const ballOwnerTeam = ball.owner?.team;

      if (ballOwnerTeam === undefined || ballOwnerTeam === null) {
        // Loose ball
        this.state = 'chase_ball';
      } else if (ballOwnerTeam !== this.team) {
        // Defense
        const mark = this._pickMarkTarget(opponents);
        if (mark) {
          this.state = 'defending';
          this.markTarget = mark;
        } else {
          this.state = 'defend_basket';
        }
      } else {
        // Offense without ball
        this.state = 'cut';
        this.cutTarget = this._findOpenSpace(opponents);
      }
    }
  }

  _execute(delta, ball, opponents, teammates) {
    const p = this.player;
    const speed = PLAYER.RUN_SPEED * (p.skills.speed / 75);

    switch (this.state) {
      case 'shooting': {
        const basketPos = this._getBasketPos();
        this._faceTarget(basketPos, delta);
        const dist = p.position.distanceTo(basketPos);

        if (dist < 8 && this.decisionCooldown < 0.5) {
          const accuracy = (p.skills.shooting / 99) * 0.7 + 0.3;
          this._doShoot(ball, basketPos, accuracy);
          this.state = 'idle';
        }
        break;
      }

      case 'driving': {
        const basketPos = this._getBasketPos();
        this._moveToward(basketPos, speed * 0.9, delta);
        break;
      }

      case 'passing': {
        if (this.passTarget) {
          this._faceTarget(this.passTarget.position, delta);
          setTimeout(() => {
            if (p.hasBall && this.passTarget && this.gm) {
              this.gm.pass(p, this.passTarget, ball);
            }
            this.state = 'cut';
          }, 300);
          this.passTarget = null;
        }
        break;
      }

      case 'chase_ball': {
        this._moveToward(ball.position, speed * 1.1, delta);
        if (ball.isNearPlayer(p.position, 1.0) && !ball.owner) {
          this.gm?.pickupBall(p, ball);
        }
        break;
      }

      case 'defending': {
        if (this.markTarget) {
          const guardPos = new THREE.Vector3().lerpVectors(
            this.markTarget.position,
            this._getBasketPos(),
            0.4,
          );
          this._moveToward(guardPos, speed * 0.95, delta);
        }
        break;
      }

      case 'defend_basket': {
        const defensivePos = this._getBasketPos();
        defensivePos.z += this.team === 0 ? 2 : -2;
        this._moveToward(defensivePos, speed * 0.7, delta);
        break;
      }

      case 'cut': {
        if (this.cutTarget) {
          this._moveToward(this.cutTarget, speed * 0.85, delta);
          if (p.position.distanceTo(this.cutTarget) < 1) {
            this.cutTarget = this._findOpenSpace(opponents);
          }
        }
        break;
      }
    }
  }

  _moveToward(target, speed, delta) {
    const p = this.player;
    const dir = new THREE.Vector3().subVectors(target, p.position);
    dir.y = 0;
    const dist = dir.length();

    if (dist < 0.5) {
      p.velocity.x *= 0.8;
      p.velocity.z *= 0.8;
      return;
    }

    dir.normalize();
    p.velocity.x = dir.x * speed;
    p.velocity.z = dir.z * speed;
    p.rotation = Math.atan2(dir.x, dir.z);

    p.position.addScaledVector(p.velocity, delta);
    p.position.x = Math.max(-COURT.WIDTH / 2 + 0.3, Math.min(COURT.WIDTH / 2 - 0.3, p.position.x));
    p.position.z = Math.max(-COURT.LENGTH / 2 + 0.3, Math.min(COURT.LENGTH / 2 - 0.3, p.position.z));

    p._animate(delta);
    p._updatePosition();
  }

  _faceTarget(target, delta) {
    const p = this.player;
    const dir = new THREE.Vector3().subVectors(target, p.position);
    if (dir.length() > 0.01) {
      const targetRot = Math.atan2(dir.x, dir.z);
      const diff = ((targetRot - p.rotation + Math.PI) % (Math.PI * 2)) - Math.PI;
      p.rotation += diff * Math.min(1, delta * 10);
    }
  }

  _doShoot(ball, targetPos, accuracy) {
    const p = this.player;
    if (!p.hasBall || !ball) return;
    p.hasBall = false;
    ball.shoot(p.getShootPosition(), targetPos, 1.0, accuracy);
    this.gm?._emit('shoot', { player: p, target: targetPos });
  }

  _getBasketPos() {
    const z = this.team === 0
      ? COURT.LENGTH / 2 - HOOP.OVERHANG
      : -(COURT.LENGTH / 2 - HOOP.OVERHANG);
    return new THREE.Vector3(0, HOOP.HEIGHT, z);
  }

  _distToBasket() {
    return this.player.position.distanceTo(this._getBasketPos());
  }

  _shootChance(dist) {
    const base = this.player.skills.shooting / 99;
    const distFactor = Math.max(0, 1 - dist / 9);
    return base * distFactor;
  }

  _findOpenTeammate(teammates, opponents) {
    return teammates.find(mate => {
      const guarder = opponents.find(opp => opp.position.distanceTo(mate.position) < 2.5);
      return !guarder;
    });
  }

  _pickMarkTarget(opponents) {
    if (!opponents.length) return null;
    // Mark the player closest to our basket
    const basket = this._getBasketPos();
    return opponents.reduce((best, opp) => {
      const d = opp.position.distanceTo(basket);
      return !best || d < best._markDist
        ? Object.assign(opp, { _markDist: d })
        : best;
    }, null);
  }

  _findOpenSpace(opponents) {
    // Find open spot on offense
    const basket = this._getBasketPos();
    const angle = (Math.random() - 0.5) * Math.PI * 1.5;
    const dist = 4 + Math.random() * 4;
    return new THREE.Vector3(
      basket.x + Math.sin(angle) * dist,
      0,
      basket.z + (this.team === 0 ? -1 : 1) * dist * 0.7,
    );
  }
}

export default AIPlayer;
