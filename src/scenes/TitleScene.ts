import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import { audio } from "../systems/AudioSystem";
import { loadMeta } from "../systems/SaveSystem";
import { getTitleKeep } from "../three/TitleKeep";
import { FONT, SANS, SERIF, touchButton } from "../ui/Hud";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("title");
  }

  create(): void {
    getTitleKeep()?.setMode("title");
    audio.startAmbience();
    this.cameras.main.setBackgroundColor("rgba(0,0,0,0)");

    this.add.text(GAME_WIDTH / 2, 104, "NOCTURNE RELIQUARY", {
      fontFamily: SERIF,
      fontSize: `${FONT.hero}px`,
      color: "#E4C37A",
      stroke: "#07071A",
      strokeThickness: 8
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 158, "Crystal Keep Defense", {
      fontFamily: SERIF,
      fontSize: "26px",
      fontStyle: "italic",
      color: "#E8DCC8"
    }).setOrigin(0.5).setAlpha(0.86);

    const meta = loadMeta();
    this.add.text(GAME_WIDTH / 2, 196, `Codex XP ${meta.codexXp}   ·   Vigils ${meta.vigils}   ·   Best wave ${meta.bestWave}`, {
      fontFamily: SANS,
      fontSize: `${FONT.small}px`,
      color: "#3EE0C4"
    }).setOrigin(0.5);

    const items: { label: string; scene?: string; extra?: () => void }[] = [
      { label: "Begin Vigil", scene: "cards" },
      { label: "Codex", scene: "codex" },
      { label: "Reliquary", extra: () => this.toast("Meta unlocks bank after each vigil.") },
      { label: "Rites", extra: () => this.toggleAudio() },
      { label: "Abandon", extra: () => this.toast("A game by the Warden of Keep Vesperis. Original work.") }
    ];

    items.forEach((item, i) => {
      const y = 262 + i * 78;
      touchButton(
        this,
        GAME_WIDTH / 2,
        y,
        item.label,
        () => {
          audio.cardDeal();
          if (item.scene) this.scene.start(item.scene);
          else item.extra?.();
        },
        { w: 420, h: 66, size: FONT.title, fill: 0x07071a }
      );
    });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, "Hold the nave. Spend the blood. Bind the relic.", {
      fontFamily: SERIF,
      fontStyle: "italic",
      fontSize: `${FONT.body}px`,
      color: "#C43B4B"
    }).setOrigin(0.5);
  }

  toast(msg: string): void {
    const t = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 76, msg, {
      fontFamily: SANS,
      fontSize: `${FONT.body}px`,
      color: "#E4C37A",
      backgroundColor: "#07071acc",
      padding: { x: 16, y: 10 }
    }).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(2200, () => t.destroy());
  }

  toggleAudio(): void {
    audio.muted = !audio.muted;
    this.toast(audio.muted ? "Rites: silence in the nave." : "Rites: the choir returns.");
  }
}
