import { dist } from "../util/math";
import type { Enemy } from "./Enemy";

export class Projectile {
  x: number;
  y: number;
  target: Enemy;
  speed: number;
  damage: number;
  element: string;
  color: number;
  alive = true;
  onHit?: (enemy: Enemy) => void;

  constructor(x: number, y: number, target: Enemy, speed: number, damage: number, element: string, color: number) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.speed = speed;
    this.damage = damage;
    this.element = element;
    this.color = color;
  }

  update(dt: number): void {
    if (!this.target.alive) {
      this.alive = false;
      return;
    }
    const d = dist(this, this.target);
    const step = this.speed * dt;
    if (step >= d) {
      this.x = this.target.x;
      this.y = this.target.y;
      this.onHit?.(this.target);
      this.alive = false;
      return;
    }
    this.x += ((this.target.x - this.x) / d) * step;
    this.y += ((this.target.y - this.y) / d) * step;
  }
}
