import { audio } from "../src/systems/AudioSystem";
import { dist } from "../src/util/math";
import { firstN } from "./targeting";
import type { TowerBehavior } from "./types";

export const moonshadeDuelist: TowerBehavior = {
  id: "moonshade-duelist",
  acquireTargets(ctx) {
    return firstN(ctx, ctx.moon >= 0.85 ? 2 : 1);
  },
  onUpdate(ctx, dt) {
    if (!ctx.tower.has("bathed")) return;
    ctx.tower.pulse += dt;
    if (ctx.tower.pulse < 9) return;
    ctx.tower.pulse = 0;
    audio.whip();
    for (const e of ctx.enemies) {
      if (!e.alive) continue;
      if (dist(e, ctx.tower) <= ctx.tower.range + 70) {
        const dealt = e.takeDamage(ctx.tower.damage * 1.8, "shadow");
        ctx.tower.damageDone += dealt;
        ctx.tower.ap += dealt * 0.08;
      }
    }
    ctx.float(ctx.tower.x, ctx.tower.y - 28, "Bathed", "#c43b4b");
  },
  onFire(ctx, targets) {
    audio.tone(490, 0.06, "square", 0.03);
    const moonBonus = 1 + ctx.moon * 0.55;
    for (const e of targets) {
      const dealt = e.takeDamage(ctx.tower.damage * moonBonus, "shadow");
      ctx.tower.damageDone += dealt;
      ctx.tower.ap += dealt * 0.08;
      ctx.float(e.x, e.y - 10, `${Math.round(dealt)}`, "#c9d4e8");
      if (ctx.moon >= 0.85 && ctx.tower.has("lifesteal")) ctx.healHeart(0.35);
    }
  }
};
