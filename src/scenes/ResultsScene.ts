import Phaser from "phaser";
import { GAME_WIDTH } from "../config";
import { loadMeta, saveMeta } from "../systems/SaveSystem";
import { run, towerById } from "../systems/RunState";
import { getTitleKeep } from "../three/TitleKeep";
import { FONT, SANS, SERIF, touchButton } from "../ui/Hud";

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super("results");
  }

  create(): void {
    getTitleKeep()?.setMode("title");
    const won = !!run.won;
    this.add.rectangle(0, 0, 1280, 720, 0x07071a, 0.78).setOrigin(0);
    this.add.text(GAME_WIDTH / 2, 120, won ? "THE HEART STILL BURNS" : "THE NAVE GOES DARK", {
      fontFamily: SERIF,
      fontSize: "42px",
      color: won ? "#3EE0C4" : "#C43B4B"
    }).setOrigin(0.5);

    const cardNames = (run.selected || []).map((id) => {
      try { return towerById(id).name; } catch { return id; }
    });
    const lines = [
      `Wave reached: ${run.waveReached ?? 0}`,
      `Kills: ${run.kills ?? 0}`,
      `Warden XP: ${Math.floor(run.xpEarned ?? 0)}`,
      `Gold earned: ${Math.floor(run.goldEarned ?? 0)}`,
      `Cards: ${cardNames.join(", ")}`,
      `Relic: ${run.relicId}`
    ];
    this.add.text(GAME_WIDTH / 2, 270, lines.join("\n"), {
      fontFamily: SANS,
      fontSize: `${FONT.label}px`,
      color: "#E8DCC8",
      align: "center",
      lineSpacing: 10
    }).setOrigin(0.5, 0);

    const meta = loadMeta();
    meta.vigils += 1;
    meta.codexXp += Math.floor(run.xpEarned ?? 0);
    meta.bestWave = Math.max(meta.bestWave, run.waveReached ?? 0);
    saveMeta(meta);

    touchButton(this, GAME_WIDTH / 2, 630, "Return to Title", () => this.scene.start("title"), {
      w: 340, h: 72, size: FONT.title, fill: 0x10122b
    });
  }
}
