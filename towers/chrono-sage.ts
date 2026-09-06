import { Projectile } from "../src/entities/Projectile";
import { audio } from "../src/systems/AudioSystem";
import { dist } from "../src/util/math";
import { firstN } from "./targeting";
import type { TowerBehavior } from "./types";

export const chronoSage: TowerBehavior = {
  id: "chrono-sage",
  acquireTargets(ctx) {
    return firstN(ctx, 1);
  },
  onUpdate(ctx, dt) {
    const mag = ctx.tower.has("grain") ? 0.45 : 0.28;
    for (const e of ctx.enemies) {
      if (e.alive && dist(e, ctx.tower) <= ctx.tower.range * 0.72) {
        e.applyStatus("slow", 0.25, mag);
      }
    }
    if (!ctx.tower.has("broken-sabbath")) return;
    ctx.tower.pulse += dt;
    if (ctx.tower.pulse >= 18) {
      ctx.tower.pulse = 0;
      audio.tone(200, 0.3, "sine", 0.06);
      for (const e of ctx.enemies) {
        if (e.alive) e.applyStatus("slow", 3, 0.55);
      }
      ctx.float(ctx.tower.x, ctx.tower.y - 28, "Broken Sabbath", "#c9a27a");
    }
  },
  onFire(ctx, targets) {
    audio.tone(300, 0.07, "triangle", 0.03);
    for (const t of targets) {
      const p = new Projectile(ctx.tower.x, ctx.tower.y, t, 380, ctx.tower.damage, "time", 0xc9a27a);
      p.onHit = (enemy) => {
        const dealt = enemy.takeDamage(ctx.tower.damage, "time");
        ctx.tower.damageDone += dealt;
        ctx.tower.ap += dealt * 0.08;
        enemy.applyStatus("slow", 1.1, 0.25);
        ctx.float(enemy.x, enemy.y - 10, `${Math.round(dealt)}`, "#c9a27a");
      };
      ctx.spawnProjectile(p);
    }
  }
};
