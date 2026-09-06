import { Projectile } from "../src/entities/Projectile";
import { audio } from "../src/systems/AudioSystem";
import { firstN } from "./targeting";
import type { TowerBehavior } from "./types";

export const sanctumCantor: TowerBehavior = {
  id: "sanctum-cantor",
  acquireTargets(ctx) {
    const undead = ctx.enemies.filter(
      (e) => e.alive && (e.def.tags.includes("undead") || e.def.tags.includes("shade"))
    );
    if (undead.length) {
      const tagged = firstN({ ...ctx, enemies: undead }, 1);
      if (tagged.length) return tagged;
    }
    return firstN(ctx, 1);
  },
  onUpdate(ctx, dt) {
    if (ctx.tower.has("ward")) ctx.healHeart(1.2 * dt);
    ctx.tower.pulse += dt;
    if (ctx.tower.has("nave-benediction") && ctx.tower.pulse >= 20) {
      ctx.tower.pulse = 0;
      ctx.healHeart(8);
      ctx.float(ctx.tower.x, ctx.tower.y - 30, "Benediction", "#f3e6b4");
    }
  },
  onFire(ctx, targets) {
    audio.tone(660, 0.1, "triangle", 0.04);
    for (const t of targets) {
      const p = new Projectile(ctx.tower.x, ctx.tower.y, t, 400, ctx.tower.damage, "holy", 0xf3e6b4);
      p.onHit = (enemy) => {
        let dmg = ctx.tower.damage;
        if (ctx.tower.has("choir") && enemy.def.tags.includes("undead")) dmg *= 1.3;
        const dealt = enemy.takeDamage(dmg, "holy");
        ctx.tower.damageDone += dealt;
        ctx.tower.ap += dealt * 0.08;
        ctx.float(enemy.x, enemy.y - 12, `${Math.round(dealt)}`, "#f3e6b4");
      };
      ctx.spawnProjectile(p);
    }
  }
};
