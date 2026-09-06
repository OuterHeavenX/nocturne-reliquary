import { audio } from "../src/systems/AudioSystem";
import { firstN } from "./targeting";
import type { TowerBehavior } from "./types";

export const aegisTemplar: TowerBehavior = {
  id: "aegis-templar",
  acquireTargets(ctx) {
    return firstN(ctx, 2);
  },
  onFire(ctx, targets) {
    audio.tone(120, 0.12, "square", 0.05);
    const tauntT = ctx.tower.has("taunt") ? 2.2 : 1.2;
    for (const e of targets) {
      const dealt = e.takeDamage(ctx.tower.damage, "holy");
      ctx.tower.damageDone += dealt;
      ctx.tower.ap += dealt * 0.08;
      e.applyStatus("slow", tauntT, 0.45);
      ctx.float(e.x, e.y - 10, `${Math.round(dealt)}`, "#e4c37a");
    }
  }
};
