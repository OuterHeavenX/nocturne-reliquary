import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import { audio } from "../systems/AudioSystem";
import { loadMeta } from "../systems/SaveSystem";
import { getTitleKeep } from "../three/TitleKeep";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("title");
  }

  create(): void {
    getTitleKeep()?.setMode("title");
    audio.startAmbience();
    this.cameras.main.setBackgroundColor("rgba(0,0,0,0)");

    this.add.text(GAME_WIDTH / 2, 118, "NOCTURNE RELIQUARY", {
      fontFamily: "Georgia, Times, serif",
      fontSize: "54px",
      color: "#E4C37A",
      stroke: "#07071A",
      strokeThickness: 8
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 176, "Crystal Keep Defense", {
      fontFamily: "Georgia, Times, serif",
      fontSize: "22px",
      fontStyle: "italic",
      color: "#E8DCC8"
    }).setOrigin(0.5).setAlpha(0.86);

    const meta = loadMeta();
    this.add.text(GAME_WIDTH / 2, 214, `Codex XP ${meta.codexXp}   ·   Vigils ${meta.vigils}   ·   Best wave ${meta.bestWave}`, {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "14px",
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
      const y = 300 + i * 58;
      const hit = this.add.rectangle(GAME_WIDTH / 2, y, 360, 48, 0x07071a, 0.55).setStrokeStyle(1, 0xe4c37a, 0.65).setInteractive({ useHandCursor: true });
      const label = this.add.text(GAME_WIDTH / 2, y, item.label, {
        fontFamily: "Georgia, Times, serif",
        fontSize: "22px",
        color: "#E8DCC8"
      }).setOrigin(0.5);
      hit.on("pointerover", () => {
        hit.setStrokeStyle(2, 0x3ee0c4, 1);
        label.setColor("#E4C37A");
        audio.tone(640, 0.05, "sine", 0.03);
      });
      hit.on("pointerout", () => {
        hit.setStrokeStyle(1, 0xe4c37a, 0.65);
        label.setColor("#E8DCC8");
      });
      hit.on("pointerdown", () => {
        audio.cardDeal();
        if (item.scene) this.scene.start(item.scene);
        else item.extra?.();
      });
    });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 36, "Hold the nave. Spend the blood. Bind the relic.", {
      fontFamily: "Georgia, Times, serif",
      fontStyle: "italic",
      fontSize: "16px",
      color: "#C43B4B"
    }).setOrigin(0.5);
  }

  toast(msg: string): void {
    const t = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, msg, {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "16px",
      color: "#E4C37A",
      backgroundColor: "#07071acc",
      padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(2200, () => t.destroy());
  }

  toggleAudio(): void {
    audio.muted = !audio.muted;
    this.toast(audio.muted ? "Rites: silence in the nave." : "Rites: the choir returns.");
  }
}
