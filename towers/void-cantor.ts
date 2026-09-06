import { Projectile } from "../src/entities/Projectile";
import { audio } from "../src/systems/AudioSystem";
import { firstN } from "./targeting";
import type { TowerBehavior } from "./types";

const cycle = [
  { element: "flame", color: 0xff6b3d },
  { element: "frost", color: 0x7ecbff },
  { element: "storm", color: 0xf4e27a }
];

export const voidCantor: TowerBehavior = {
  id: "void-cantor",
  acquireTargets(ctx) {
    return firstN(ctx, 1);
  },
  onFire(ctx, targets) {
    const shot = ctx.tower.elementCycle++;
    const school = cycle[shot % 3];
    audio.tone(340 + (shot % 3) * 80, 0.08, "sine", 0.04);
    const fireOne = (element: string, color: number) => {
      const t = targets[0];
      if (!t) return;
      const p = new Projectile(ctx.tower.x, ctx.tower.y, t, 420, ctx.tower.damage, element, color);
      p.onHit = (enemy) => {
        const dealt = enemy.takeDamage(ctx.tower.damage, element);
        ctx.tower.damageDone += dealt;
        ctx.tower.ap += dealt * 0.08;
        if (element === "frost") enemy.applyStatus("slow", 1.4, 0.35);
        if (element === "flame" && ctx.tower.has("burn")) enemy.applyStatus("slow", 0.8, 0.1);
        ctx.float(enemy.x, enemy.y - 12, `${Math.round(dealt)}`, "#b07cff");
      };
      ctx.spawnProjectile(p);
    };
    if (ctx.tower.has("triune-seal") && shot % 4 === 3) {
      for (const s of cycle) fireOne(s.element, s.color);
    } else {
      fireOne(school.element, school.color);
    }
  }
};
