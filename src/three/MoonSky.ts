/** Moon fill used by match HUD; TitleKeep owns the 3D moon mesh. */
export function moonPhase(waveIndex: number, waveCount = 12): number {
  return Math.min(1, Math.max(0, (waveIndex + 1) / waveCount));
}
