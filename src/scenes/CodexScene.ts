import Phaser from "phaser";
import { GAME_WIDTH } from "../config";
import { TOWER_DEFS } from "../systems/RunState";
import { getTitleKeep } from "../three/TitleKeep";
import { FONT, SERIF, touchButton } from "../ui/Hud";

export class CodexScene extends Phaser.Scene {
  constructor() {
    super("codex");
  }

  create(): void {
    getTitleKeep()?.setMode("cards");
    this.add.rectangle(0, 0, 1280, 720, 0x07071a, 0.8).setOrigin(0);
    this.add.text(GAME_WIDTH / 2, 38, "CODEX OF KEEP VESPERIS", {
      fontFamily: SERIF,
      fontSize: `${FONT.title}px`,
      color: "#E4C37A"
    }).setOrigin(0.5);

    // Two columns so every entry stays at a readable size on a phone.
    TOWER_DEFS.forEach((def, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 60 + col * 620;
      const y = 130 + row * 132;
      this.add.image(x + 30, y, `tower-${def.id}`).setScale(1);
      this.add.text(x + 76, y - 32, `${def.name}  —  ${def.role}`, {
        fontFamily: SERIF,
        fontSize: `${FONT.label}px`,
        color: "#E4C37A",
        wordWrap: { width: 520 }
      });
      this.add.text(x + 76, y + 6, def.line, {
        fontFamily: SERIF,
        fontStyle: "italic",
        fontSize: `${FONT.tiny}px`,
        color: "#E8DCC8",
        wordWrap: { width: 520 }
      }).setAlpha(0.85);
    });

    touchButton(this, 100, 36, "← Title", () => this.scene.start("title"), {
      w: 160, h: 56, size: FONT.small, fill: 0x07071a
    });
  }
}
