import { Projectile } from "../src/entities/Projectile";
import { audio } from "../src/systems/AudioSystem";
import { dist } from "../src/util/math";
import { firstN } from "./targeting";
import type { TowerBehavior } from "./types";

export const eidolonBinder: TowerBehavior = {
  id: "eidolon-binder",
  acquireTargets(ctx) {
    return firstN(ctx, ctx.tower.has("twin") ? 2 : 1);
  },
  onUpdate(ctx, dt) {
    ctx.tower.pulse += dt;
    const tick = ctx.tower.has("tether") ? 0.45 : 0.6;
    if (ctx.tower.pulse < tick) return;
    ctx.tower.pulse = 0;
    const shades = ctx.tower.has("twin") ? 2 : 1;
    const nearby = ctx.enemies
      .filter((e) => e.alive && dist(e, ctx.tower) <= ctx.tower.range + 20)
      .sort((a, b) => b.progress - a.progress)
      .slice(0, shades);
    let fang = ctx.tower.damage * 0.9;
    if (ctx.tower.has("fang")) fang *= 1.4;
    for (const e of nearby) {
      const dealt = e.takeDamage(fang, "shadow");
      ctx.tower.damageDone += dealt;
      ctx.tower.ap += dealt * 0.08;
      ctx.float(e.x, e.y - 8, `${Math.round(dealt)}`, "#9b6bff");
      if (ctx.tower.has("true-name") && Math.random() < 0.12) {
        e.applyStatus("slow", 1.6, 0.4);
        ctx.float(e.x, e.y - 22, "True Name", "#3ee0c4");
      }
    }
  },
  onFire(ctx, targets) {
    audio.tone(280, 0.08, "sine", 0.03);
    for (const t of targets) {
      const p = new Projectile(ctx.tower.x, ctx.tower.y, t, 360, ctx.tower.damage * 0.6, "shadow", 0x9b6bff);
      p.onHit = (enemy) => {
        const dealt = enemy.takeDamage(ctx.tower.damage * 0.6, "shadow");
        ctx.tower.damageDone += dealt;
        ctx.tower.ap += dealt * 0.08;
      };
      ctx.spawnProjectile(p);
    }
  }
};
