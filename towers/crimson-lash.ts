import { Projectile } from "../src/entities/Projectile";
import { audio } from "../src/systems/AudioSystem";
import { firstN } from "./targeting";
import type { TowerBehavior } from "./types";

export const crimsonLash: TowerBehavior = {
  id: "crimson-lash",
  acquireTargets(ctx) {
    const n = ctx.tower.has("judgment-coil") ? 3 : 1;
    return firstN(ctx, n);
  },
  onFire(ctx, targets) {
    audio.whip();
    for (const t of targets) {
      const p = new Projectile(ctx.tower.x, ctx.tower.y, t, 520, ctx.tower.damage, "holy", 0xc43b4b);
      p.onHit = (enemy) => {
        let dmg = ctx.tower.damage;
        if (ctx.tower.has("undead") && enemy.def.tags.includes("undead")) dmg *= 1.6;
        const dealt = enemy.takeDamage(dmg, "holy");
        ctx.tower.damageDone += dealt;
        ctx.tower.ap += dealt * 0.08;
        ctx.float(enemy.x, enemy.y - 12, `${Math.round(dealt)}`, "#c43b4b");
      };
      ctx.spawnProjectile(p);
    }
  }
};
