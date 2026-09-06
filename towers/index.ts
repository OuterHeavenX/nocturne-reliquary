import { aegisTemplar } from "./aegis-templar";
import { chronoSage } from "./chrono-sage";
import { crimsonLash } from "./crimson-lash";
import { eidolonBinder } from "./eidolon-binder";
import { moonshadeDuelist } from "./moonshade-duelist";
import { sanctumCantor } from "./sanctum-cantor";
import { skyPiercer } from "./sky-piercer";
import type { TowerBehavior } from "./types";
import { voidCantor } from "./void-cantor";

export const behaviors: Record<string, TowerBehavior> = {
  [crimsonLash.id]: crimsonLash,
  [voidCantor.id]: voidCantor,
  [sanctumCantor.id]: sanctumCantor,
  [skyPiercer.id]: skyPiercer,
  [eidolonBinder.id]: eidolonBinder,
  [moonshadeDuelist.id]: moonshadeDuelist,
  [aegisTemplar.id]: aegisTemplar,
  [chronoSage.id]: chronoSage
};

export function getBehavior(id: string): TowerBehavior {
  const b = behaviors[id];
  if (!b) throw new Error(`Missing tower behavior: ${id}`);
  return b;
}
