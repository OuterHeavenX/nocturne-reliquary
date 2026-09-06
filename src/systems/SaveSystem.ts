const KEY = "nocturne-reliquary-save";

export interface MetaSave {
  codexXp: number;
  vigils: number;
  bestWave: number;
}

export function loadMeta(): MetaSave {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { codexXp: 0, vigils: 0, bestWave: 0 };
    return { codexXp: 0, vigils: 0, bestWave: 0, ...JSON.parse(raw) };
  } catch {
    return { codexXp: 0, vigils: 0, bestWave: 0 };
  }
}

export function saveMeta(meta: MetaSave): void {
  localStorage.setItem(KEY, JSON.stringify(meta));
}
