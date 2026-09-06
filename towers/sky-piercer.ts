import { audio } from "../src/systems/AudioSystem";
import { dist } from "../src/util/math";
import { firstN } from "./targeting";
import type { TowerBehavior } from "./types";

export const skyPiercer: TowerBehavior = {
  id: "sky-piercer",
  acquireTargets(ctx) {
    return firstN(ctx, 1);
  },
  onFire(ctx, targets) {
    audio.slam();
    const radius = ctx.tower.has("crater") ? 92 : 70;
    const slams = ctx.tower.has("sixfold-descent") ? 3 : 1;
    const origin = targets[0] ?? { x: ctx.tower.x, y: ctx.tower.y + 40, alive: true };
    for (let i = 0; i < slams; i++) {
      const ox = origin.x + i * 36;
      const oy = origin.y + i * 8;
      for (const e of ctx.enemies) {
        if (!e.alive) continue;
        if (e.def.flying && !ctx.tower.hitsAir) continue;
        if (dist(e, { x: ox, y: oy }) <= radius) {
          const dealt = e.takeDamage(ctx.tower.damage, "physical");
          ctx.tower.damageDone += dealt;
          ctx.tower.ap += dealt * 0.08;
          ctx.float(e.x, e.y - 10, `${Math.round(dealt)}`, "#4aa3ff");
        }
      }
    }
  }
};
