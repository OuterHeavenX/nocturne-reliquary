import { PATH } from "../config";
import { dist } from "../util/math";

export interface EnemyDef {
  id: string;
  name: string;
  hp: number;
  speed: number;
  armor: number;
  reward: number;
  xp: number;
  tags: string[];
  flying: boolean;
  color: string;
  leaks: number;
}

export interface Status {
  id: string;
  duration: number;
  magnitude: number;
}

export class Enemy {
  def: EnemyDef;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  pathIndex = 0;
  alive = true;
  reached = false;
  statuses: Status[] = [];
  slowMul = 1;
  sprite?: Phaser.GameObjects.Image;
  bar?: Phaser.GameObjects.Graphics;

  constructor(def: EnemyDef) {
    this.def = def;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.x = PATH[0].x;
    this.y = PATH[0].y;
  }

  get progress(): number {
    return this.pathIndex + 0.001;
  }

  applyStatus(id: string, duration: number, magnitude: number): void {
    const existing = this.statuses.find((s) => s.id === id);
    if (existing) {
      existing.duration = Math.max(existing.duration, duration);
      existing.magnitude = Math.max(existing.magnitude, magnitude);
      return;
    }
    this.statuses.push({ id, duration, magnitude });
  }

  takeDamage(raw: number, element = "physical"): number {
    if (!this.alive) return 0;
    let mul = 1;
    if (element === "holy" && (this.def.tags.includes("undead") || this.def.tags.includes("shade"))) mul += 0.45;
    if (element === "storm" && this.def.flying) mul += 0.35;
    if (element === "flame" && this.def.tags.includes("armored")) mul += 0.2;
    if (element === "frost" && this.def.tags.includes("runner")) mul += 0.25;
    if (element === "shadow" && this.def.tags.includes("healer")) mul += 0.35;
    if (element === "time" && this.def.tags.includes("boss")) mul += 0.2;
    const dealt = Math.max(1, raw * mul - this.def.armor * 0.35);
    this.hp -= dealt;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
    return dealt;
  }

  update(dt: number): void {
    if (!this.alive) return;
    this.slowMul = 1;
    for (const s of this.statuses) {
      s.duration -= dt;
      if (s.id === "slow" || s.id === "frost" || s.id === "time") {
        this.slowMul = Math.min(this.slowMul, 1 - s.magnitude);
      }
    }
    this.statuses = this.statuses.filter((s) => s.duration > 0);
    this.slowMul = Math.max(0.25, this.slowMul);
    const target = PATH[this.pathIndex + 1];
    if (!target) {
      this.reached = true;
      this.alive = false;
      return;
    }
    const speed = this.def.speed * this.slowMul;
    const d = dist(this, target);
    const step = speed * dt;
    if (step >= d) {
      this.x = target.x;
      this.y = target.y;
      this.pathIndex += 1;
    } else {
      this.x += ((target.x - this.x) / d) * step;
      this.y += ((target.y - this.y) / d) * step;
    }
  }
}
