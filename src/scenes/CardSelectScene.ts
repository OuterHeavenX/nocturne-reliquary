import Phaser from "phaser";
import { GAME_WIDTH } from "../config";
import { audio } from "../systems/AudioSystem";
import { RELIC_DEFS, run, TOWER_DEFS, towerById } from "../systems/RunState";
import { getTitleKeep } from "../three/TitleKeep";
import { FONT, SANS, SERIF, touchButton } from "../ui/Hud";
import { isTouch } from "../ui/Stage";

export class CardSelectScene extends Phaser.Scene {
  constructor() {
    super("cards");
  }

  create(): void {
    getTitleKeep()?.setMode("cards");
    this.add.rectangle(0, 0, GAME_WIDTH, 720, 0x07071a, 0.62).setOrigin(0);
    this.add.text(GAME_WIDTH / 2, 34, "SEAL THREE JOB-RELIC CARDS", {
      fontFamily: SERIF, fontSize: `${FONT.title}px`, color: "#E4C37A"
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 72, isTouch
      ? "Tap to choose · tap a chosen card again to mark it Signature"
      : "Click to choose · click a chosen card again to mark it Signature", {
      fontFamily: SANS, fontSize: `${FONT.small}px`, color: "#E8DCC8"
    }).setOrigin(0.5).setAlpha(0.85);

    const selected = new Set<string>(run.selected);
    let signature = run.signature;
    let relicId = run.relicId;

    const status = this.add.text(GAME_WIDTH / 2, 104, "", {
      fontFamily: SANS, fontSize: `${FONT.body}px`, color: "#3EE0C4"
    }).setOrigin(0.5);

    // Cards and relic plates repaint in place rather than restarting the scene —
    // a full scene rebuild on every tap feels like lag on a phone.
    const cards: { id: string; img: Phaser.GameObjects.Image; seal: Phaser.GameObjects.Text }[] = [];
    const relicBoxes: { id: string; box: Phaser.GameObjects.Rectangle }[] = [];

    const commit = () => {
      run.selected = [...selected];
      run.signature = signature;
      run.relicId = relicId;
    };

    const refresh = () => {
      status.setText(
        `Loadout ${selected.size}/3   ·   Signature: ${signature ? towerById(signature).name : "—"}   ·   Relic: ${
          RELIC_DEFS.find((r) => r.id === relicId)?.name ?? "—"
        }`
      );
      for (const c of cards) {
        const on = selected.has(c.id);
        c.img.setTint(on ? 0xffffff : 0x8899aa);
        c.img.setScale(on ? 0.56 : 0.52);
        c.seal.setText(on ? (signature === c.id ? "SIGNATURE" : "SEATED") : "");
      }
      for (const r of relicBoxes) r.box.setStrokeStyle(relicId === r.id ? 3 : 1, relicId === r.id ? 0x3ee0c4 : 0xe4c37a);
      start.setEnabled(selected.size === 3);
    };

    TOWER_DEFS.forEach((def, i) => {
      const x = 88 + i * 152;
      const y = 262;
      const img = this.add.image(x, y, `card-${def.id}`).setScale(0.52);
      // The card art is 220x320 before scaling; give the finger the whole plate.
      img.setInteractive(new Phaser.Geom.Rectangle(-14, -14, 248, 348), Phaser.Geom.Rectangle.Contains);
      img.input!.cursor = "pointer";
      this.add.text(x, y + 104, def.name, {
        fontFamily: SERIF, fontSize: `${FONT.tiny}px`, color: "#E4C37A", align: "center", wordWrap: { width: 148 }
      }).setOrigin(0.5, 0);
      this.add.text(x, y + 142, def.role, {
        fontFamily: SANS, fontSize: `${FONT.tiny}px`, color: "#E8DCC8"
      }).setOrigin(0.5, 0).setAlpha(0.85);
      const seal = this.add.text(x, y - 108, "", {
        fontFamily: SERIF, fontSize: `${FONT.tiny}px`, color: "#C43B4B"
      }).setOrigin(0.5);
      cards.push({ id: def.id, img, seal });

      img.on("pointerdown", () => {
        if (selected.has(def.id)) {
          if (signature === def.id) {
            selected.delete(def.id);
            signature = "";
          } else signature = def.id;
        } else if (selected.size < 3) {
          selected.add(def.id);
          if (!signature) signature = def.id;
        }
        audio.cardDeal();
        commit();
        refresh();
      });
    });

    RELIC_DEFS.forEach((rel, i) => {
      const x = 190 + i * 300;
      const y = 512;
      const box = this.add.rectangle(x, y, 280, 118, 0x10122b, 0.92)
        .setStrokeStyle(1, 0xe4c37a)
        .setInteractive({ useHandCursor: true });
      this.add.text(x, y - 38, rel.name, { fontFamily: SERIF, fontSize: `${FONT.label}px`, color: "#E4C37A" }).setOrigin(0.5);
      this.add.text(x, y - 8, rel.line, { fontFamily: SERIF, fontStyle: "italic", fontSize: `${FONT.tiny}px`, color: "#E8DCC8" }).setOrigin(0.5);
      this.add.text(x, y + 30, rel.desc, { fontFamily: SANS, fontSize: `${FONT.tiny}px`, color: "#9aa0b8", wordWrap: { width: 260 }, align: "center" }).setOrigin(0.5);
      relicBoxes.push({ id: rel.id, box });
      box.on("pointerdown", () => {
        relicId = rel.id;
        audio.tone(400, 0.08, "triangle", 0.04);
        commit();
        refresh();
      });
    });

    const start = touchButton(this, GAME_WIDTH / 2, 640, "Seal the Pact", () => {
      if (selected.size !== 3) return;
      signature = signature || [...selected][0];
      commit();
      audio.seal();
      this.cameras.main.fadeOut(500, 7, 7, 26);
      this.time.delayedCall(520, () => this.scene.start("keep"));
    }, { w: 340, h: 72, size: FONT.title, fill: 0xc43b4b, color: "#F5EEDC" });

    touchButton(this, 100, 36, "← Title", () => this.scene.start("title"), {
      w: 160, h: 56, size: FONT.small, fill: 0x07071a
    });

    refresh();
  }
}
