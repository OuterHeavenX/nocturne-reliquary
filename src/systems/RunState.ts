import type { TowerDef } from "../../towers/types";
import towers from "../../data/towers.json";
import relics from "../../data/relics.json";

export interface RelicDef {
  id: string;
  name: string;
  line: string;
  desc: string;
}

export const TOWER_DEFS = towers as TowerDef[];
export const RELIC_DEFS = relics as RelicDef[];

export function towerById(id: string): TowerDef {
  const t = TOWER_DEFS.find((d) => d.id === id);
  if (!t) throw new Error(id);
  return t;
}

export interface RunState {
  selected: string[];
  signature: string;
  relicId: string;
  won?: boolean;
  waveReached?: number;
  goldEarned?: number;
  xpEarned?: number;
  kills?: number;
}

export const run: RunState = {
  selected: [],
  signature: "",
  relicId: "tithe-chalice"
};

export function resetRun(): void {
  run.selected = [];
  run.signature = "";
  run.relicId = "tithe-chalice";
  run.won = undefined;
}
