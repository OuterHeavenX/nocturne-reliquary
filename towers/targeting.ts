import type { Enemy } from "../src/entities/Enemy";
import { dist } from "../src/util/math";
import type { FireContext } from "./types";

export function inRange(ctx: FireContext, enemy: Enemy, range = ctx.tower.range): boolean {
  if (!enemy.alive) return false;
  if (enemy.def.flying && !ctx.tower.hitsAir) return false;
  return dist(ctx.tower, enemy) <= range;
}

export function firstN(ctx: FireContext, n: number, range?: number): Enemy[] {
  return ctx.enemies
    .filter((e) => inRange(ctx, e, range))
    .sort((a, b) => b.progress - a.progress)
    .slice(0, n);
}

export function strongest(ctx: FireContext, n = 1): Enemy[] {
  return ctx.enemies
    .filter((e) => inRange(ctx, e))
    .sort((a, b) => b.hp - a.hp)
    .slice(0, n);
}
