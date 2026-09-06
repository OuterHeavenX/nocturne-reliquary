const KEY = "nocturne-reliquary-save";

export interface MetaSave {
  codexXp: number;
  vigils: number;
  bestWave: number;
}

const EMPTY: MetaSave = { codexXp: 0, vigils: 0, bestWave: 0 };

export function loadMeta(): MetaSave {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY };
  }
}

export function saveMeta(meta: MetaSave): void {
  // Private browsing, a sandboxed frame, or a full quota all throw here. Losing
  // the codex is survivable; taking the results screen down with it is not.
  try {
    localStorage.setItem(KEY, JSON.stringify(meta));
  } catch {
    /* The vigil still counts, it just will not be remembered. */
  }
}
