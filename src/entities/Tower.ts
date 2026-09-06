import type { TowerDef } from "../../towers/types";

export class Tower {
  def: TowerDef;
  x: number;
  y: number;
  socketIndex: number;
  cooldown = 0;
  ap = 0;
  unlocked = new Set<string>();
  kills = 0;
  damageDone = 0;
  elementCycle = 0;
  pulse = 0;
  signature = false;
  altar = false;

  constructor(def: TowerDef, x: number, y: number, socketIndex: number) {
    this.def = def;
    this.x = x;
    this.y = y;
    this.socketIndex = socketIndex;
  }

  has(node: string): boolean {
    return this.unlocked.has(node);
  }

  get range(): number {
    let r = this.def.range;
    if (this.altar) r *= 1.18;
    if (this.signature) r *= 1.08;
    if (this.has("reach") || this.has("Longer Measure")) r += 24;
    if (this.def.id === "crimson-lash" && this.has("reach")) r += 18;
    if (this.def.id === "moonshade-duelist" && this.has("reach")) r += 16;
    return r;
  }

  get damage(): number {
    let d = this.def.damage;
    if (this.signature) d *= 1.12;
    if (this.has("hone") || this.has("focus") || this.has("shine") || this.has("mass") || this.has("bulk") || this.has("fang")) {
      d *= this.has("mass") ? 1.3 : 1.25;
    }
    if (this.def.id === "chrono-sage" && this.has("sting")) d *= 1.6;
    if (this.def.id === "sky-piercer" && this.has("mass")) d *= 1.08;
    return d;
  }

  get fireRate(): number {
    let f = this.def.fireRate;
    if (this.has("tempo")) f *= 1.22;
    if (this.def.id === "eidolon-binder" && this.has("tether")) f *= 1.2;
    return f;
  }

  get hitsAir(): boolean {
    return this.def.hitsAir || this.has("aircut") || (this.def.id === "crimson-lash" && this.has("judgment-coil"));
  }

  spendAp(nodeId: string, cost: number): boolean {
    if (this.has(nodeId) || this.ap < cost) return false;
    this.ap -= cost;
    this.unlocked.add(nodeId);
    return true;
  }
}
