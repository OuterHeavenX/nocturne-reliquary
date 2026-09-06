import type { Enemy } from "../src/entities/Enemy";
import type { Tower } from "../src/entities/Tower";
import type { MatchContext } from "../src/systems/MatchContext";

export interface TowerDef {
  id: string;
  name: string;
  role: string;
  element: string;
  line: string;
  cost: number;
  range: number;
  damage: number;
  fireRate: number;
  hitsAir: boolean;
  color: string;
  accent: string;
  apNodes: { id: string; name: string; cost: number; desc: string }[];
}

export interface FireContext {
  tower: Tower;
  match: MatchContext;
  enemies: Enemy[];
  time: number;
}

export interface TowerBehavior {
  id: string;
  acquireTargets: (ctx: FireContext) => Enemy[];
  onFire: (ctx: FireContext, targets: Enemy[]) => void;
  onUpdate?: (ctx: FireContext, dt: number) => void;
}
