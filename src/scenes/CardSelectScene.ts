import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import { audio } from "../systems/AudioSystem";
import { RELIC_DEFS, run, TOWER_DEFS, towerById } from "../systems/RunState";
import { getTitleKeep } from "../three/TitleKeep";

export class CardSelectScene extends Phaser.Scene {
  constructor() {
    super("cards");
  }

  create(): void {
    getTitleKeep()?.setMode("cards");
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x07071a, 0.55).setOrigin(0);
    this.add.text(GAME_WIDTH / 2, 36, "SEAL THREE JOB-RELIC CARDS", {
      fontFamily: "Georgia, Times, serif", fontSize: "28px", color: "#E4C37A"
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 68, "Click to choose · click a chosen card again to mark it Signature", {
      fontFamily: "Trebuchet MS, sans-serif", fontSize: "14px", color: "#E8DCC8"
    }).setOrigin(0.5).setAlpha(0.8);

    const selected = new Set<string>(run.selected);
    let signature = run.signature;
    let relicId = run.relicId;

    const status = this.add.text(GAME_WIDTH / 2, 96, "", {
      fontFamily: "Trebuchet MS, sans-serif", fontSize: "14px", color: "#3EE0C4"
    }).setOrigin(0.5);

    const refreshStatus = () => {
      status.setText(
        `Loadout ${selected.size}/3   ·   Signature: ${signature ? towerById(signature).name : "—"}   ·   Relic: ${
          RELIC_DEFS.find((r) => r.id === relicId)?.name ?? "—"
        }`
      );
    };
    refreshStatus();

    TOWER_DEFS.forEach((def, i) => {
      const x = 90 + (i % 8) * 150;
      const y = 280;
      const card = this.add.image(x, y, `card-${def.id}`).setScale(0.58).setInteractive({ useHandCursor: true });
      this.add.text(x, y + 108, def.name, {
        fontFamily: "Georgia, Times, serif", fontSize: "13px", color: "#E4C37A", align: "center", wordWrap: { width: 130 }
      }).setOrigin(0.5);
      this.add.text(x, y + 132, def.role, {
        fontFamily: "Trebuchet MS, sans-serif", fontSize: "11px", color: "#E8DCC8"
      }).setOrigin(0.5);
      const seal = this.add.text(x, y - 108, selected.has(def.id) ? (signature === def.id ? "SIGNATURE" : "SEATED") : "", {
        fontFamily: "Georgia, Times, serif", fontSize: "11px", color: "#C43B4B"
      }).setOrigin(0.5);
      card.setTint(selected.has(def.id) ? 0xffffff : 0x8899aa);
      card.on("pointerover", () => this.tweens.add({ targets: card, scale: 0.66, duration: 160 }));
      card.on("pointerout", () => this.tweens.add({ targets: card, scale: 0.58, duration: 160 }));
      card.on("pointerdown", () => {
        if (selected.has(def.id)) {
          if (signature === def.id) {
            selected.delete(def.id);
            signature = "";
          } else signature = def.id;
        } else if (selected.size < 3) {
          selected.add(def.id);
          if (!signature) signature = def.id;
          audio.cardDeal();
        }
        run.selected = [...selected];
        run.signature = signature;
        run.relicId = relicId;
        this.scene.restart();
      });
    });

    RELIC_DEFS.forEach((rel, i) => {
      const x = 190 + i * 300;
      const y = 560;
      const box = this.add.rectangle(x, y, 270, 88, 0x10122b, 0.9)
        .setStrokeStyle(1, relicId === rel.id ? 0x3ee0c4 : 0xe4c37a)
        .setInteractive({ useHandCursor: true });
      this.add.text(x, y - 24, rel.name, { fontFamily: "Georgia, Times, serif", fontSize: "16px", color: "#E4C37A" }).setOrigin(0.5);
      this.add.text(x, y + 6, rel.line, { fontFamily: "Georgia, Times, serif", fontStyle: "italic", fontSize: "12px", color: "#E8DCC8" }).setOrigin(0.5);
      this.add.text(x, y + 28, rel.desc, { fontFamily: "Trebuchet MS, sans-serif", fontSize: "11px", color: "#9aa0b8", wordWrap: { width: 250 }, align: "center" }).setOrigin(0.5);
      box.on("pointerdown", () => {
        relicId = rel.id;
        run.relicId = rel.id;
        run.selected = [...selected];
        run.signature = signature;
        audio.tone(400, 0.08, "triangle", 0.04);
        this.scene.restart();
      });
    });

    const start = this.add.rectangle(GAME_WIDTH / 2, 670, 280, 46, 0xc43b4b, 0.9).setStrokeStyle(2, 0xe4c37a).setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH / 2, 670, "Seal the Pact", {
      fontFamily: "Georgia, Times, serif", fontSize: "20px", color: "#E8DCC8"
    }).setOrigin(0.5);
    start.on("pointerdown", () => {
      if (selected.size !== 3) return;
      run.selected = [...selected];
      run.signature = signature || [...selected][0];
      run.relicId = relicId;
      audio.seal();
      this.cameras.main.fadeOut(500, 7, 7, 26);
      this.time.delayedCall(520, () => this.scene.start("keep"));
    });

    this.add.text(40, 24, "\u2190 Title", { fontFamily: "Trebuchet MS, sans-serif", fontSize: "14px", color: "#E8DCC8" })
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.scene.start("title"));
  }
}
