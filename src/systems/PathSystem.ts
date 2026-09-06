import { PATH } from "../config";
import type { Vec2 } from "../util/math";
import { dist } from "../util/math";

export function pathLength(): number {
  let n = 0;
  for (let i = 0; i < PATH.length - 1; i++) n += dist(PATH[i], PATH[i + 1]);
  return n;
}

export function nearestPathPoint(p: Vec2): Vec2 {
  let best = PATH[0];
  let bestD = Infinity;
  for (const q of PATH) {
    const d = dist(p, q);
    if (d < bestD) {
      bestD = d;
      best = q;
    }
  }
  return best;
}
