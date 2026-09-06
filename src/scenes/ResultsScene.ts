import Phaser from "phaser";
import { GAME_WIDTH } from "../config";
import { loadMeta, saveMeta } from "../systems/SaveSystem";
import { run } from "../systems/RunState";
import { getTitleKeep } from "../three/TitleKeep";

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super("results");
  }

  create(): void {
    getTitleKeep()?.setMode("title");
    const won = !!run.won;
    this.add.rectangle(0, 0, 1280, 720, 0x07071a, 0.72).setOrigin(0);
    this.add.text(GAME_WIDTH / 2, 140, won ? "THE HEART STILL BURNS" : "THE NAVE GOES DARK", {
      fontFamily: "Georgia, Times, serif",
      fontSize: "36px",
      color: won ? "#3EE0C4" : "#C43B4B"
    }).setOrigin(0.5);

    const lines = [
      `Wave reached: ${run.waveReached ?? 0}`,
      `Kills: ${run.kills ?? 0}`,
      `Warden XP: ${Math.floor(run.xpEarned ?? 0)}`,
      `Gold earned: ${Math.floor(run.goldEarned ?? 0)}`,
      `Cards: ${(run.selected || []).join(", ")}`,
      `Relic: ${run.relicId}`
    ];
    this.add.text(GAME_WIDTH / 2, 280, lines.join("\n"), {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "18px",
      color: "#E8DCC8",
      align: "center",
      lineSpacing: 8
    }).setOrigin(0.5);

    const meta = loadMeta();
    meta.vigils += 1;
    meta.codexXp += Math.floor(run.xpEarned ?? 0);
    meta.bestWave = Math.max(meta.bestWave, run.waveReached ?? 0);
    saveMeta(meta);

    const back = this.add.rectangle(GAME_WIDTH / 2, 520, 260, 48, 0x10122b).setStrokeStyle(2, 0xe4c37a).setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH / 2, 520, "Return to Title", {
      fontFamily: "Georgia, Times, serif",
      fontSize: "18px",
      color: "#E4C37A"
    }).setOrigin(0.5);
    back.on("pointerdown", () => this.scene.start("title"));
  }
}
