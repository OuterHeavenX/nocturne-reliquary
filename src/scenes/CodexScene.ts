import Phaser from "phaser";
import { GAME_WIDTH } from "../config";
import { TOWER_DEFS } from "../systems/RunState";
import { getTitleKeep } from "../three/TitleKeep";

export class CodexScene extends Phaser.Scene {
  constructor() {
    super("codex");
  }

  create(): void {
    getTitleKeep()?.setMode("cards");
    this.add.rectangle(0, 0, 1280, 720, 0x07071a, 0.72).setOrigin(0);
    this.add.text(GAME_WIDTH / 2, 40, "CODEX OF KEEP VESPERIS", {
      fontFamily: "Georgia, Times, serif",
      fontSize: "28px",
      color: "#E4C37A"
    }).setOrigin(0.5);

    TOWER_DEFS.forEach((def, i) => {
      const y = 90 + i * 68;
      this.add.image(70, y, `tower-${def.id}`).setScale(0.72);
      this.add.text(120, y - 18, `${def.name}  —  ${def.role}`, {
        fontFamily: "Georgia, Times, serif",
        fontSize: "18px",
        color: "#E4C37A"
      });
      this.add.text(120, y + 8, def.line, {
        fontFamily: "Georgia, Times, serif",
        fontStyle: "italic",
        fontSize: "14px",
        color: "#E8DCC8"
      });
    });

    this.add.text(40, 24, "← Title", { fontFamily: "Trebuchet MS, sans-serif", fontSize: "14px", color: "#E8DCC8" })
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.scene.start("title"));
  }
}
