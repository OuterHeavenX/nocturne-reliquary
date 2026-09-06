import type { Enemy } from "../entities/Enemy";
import type { Projectile } from "../entities/Projectile";
import type { Tower } from "../entities/Tower";

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export interface MatchContext {
  towers: Tower[];
  enemies: Enemy[];
  projectiles: Projectile[];
  gold: number;
  heart: number;
  maxHeart: number;
  xp: number;
  wardenLevel: number;
  waveIndex: number;
  kills: number;
  moon: number;
  timeScale: number;
  relicId: string;
  texts: FloatingText[];
  hasteMul: (tower: Tower) => number;
  leakReduction: number;
  grantGold: (n: number) => void;
  grantXp: (n: number) => void;
  damageHeart: (n: number) => void;
  healHeart: (n: number) => void;
  spawnProjectile: (p: Projectile) => void;
  float: (x: number, y: number, text: string, color: string) => void;
}
