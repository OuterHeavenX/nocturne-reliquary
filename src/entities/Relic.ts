import { RELIC_DEFS, type RelicDef } from "../systems/RunState";

export function relicById(id: string): RelicDef {
  return RELIC_DEFS.find((r) => r.id === id) ?? RELIC_DEFS[0];
}
