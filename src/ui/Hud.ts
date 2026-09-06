import Phaser from "phaser";
import { GAME_WIDTH } from "../config";

/**
 * Type sizes in board units. The board is 1280x720 letterboxed to fit, so on a
 * landscape phone one board unit is roughly half a CSS pixel — anything under
 * ~18 here is unreadable in the hand. These are the floor.
 */
export const FONT = {
  tiny: 18,
  small: 20,
  body: 22,
  label: 24,
  title: 30,
  hero: 54
};

/** Minimum comfortable touch target in board units (~44 CSS px on a phone). */
export const TAP = 72;

export const SERIF = "Georgia, Times, serif";
export const SANS = "Trebuchet MS, sans-serif";

export function goldText(scene: Phaser.Scene, x: number, y: number, text: string, size = FONT.label): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    fontFamily: SERIF,
    fontSize: `${size}px`,
    color: "#E4C37A"
  }).setDepth(50);
}

export function boneText(scene: Phaser.Scene, x: number, y: number, text: string, size = FONT.body): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    fontFamily: SANS,
    fontSize: `${size}px`,
    color: "#E8DCC8"
  }).setDepth(50);
}

export function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, alpha = 0.78): Phaser.GameObjects.Rectangle {
  return scene.add.rectangle(x, y, w, h, 0x07071a, alpha).setStrokeStyle(2, 0xe4c37a, 0.7).setDepth(40).setOrigin(0, 0);
}

export interface TouchButton {
  box: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  setEnabled(on: boolean): void;
  setText(text: string): void;
  destroy(): void;
}

export interface ButtonOpts {
  w?: number;
  h?: number;
  size?: number;
  fill?: number;
  stroke?: number;
  color?: string;
  depth?: number;
  align?: "center" | "left";
}

/**
 * A finger-sized button. Touch devices never fire pointerover, so the press
 * feedback hangs off pointerdown/up instead of hover, and the hit area is the
 * rectangle rather than the glyphs inside it.
 */
export function touchButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  onTap: () => void,
  opts: ButtonOpts = {}
): TouchButton {
  const w = opts.w ?? 200;
  const h = opts.h ?? TAP;
  const depth = opts.depth ?? 50;
  const stroke = opts.stroke ?? 0xe4c37a;
  const color = opts.color ?? "#E8DCC8";
  let enabled = true;

  const box = scene.add
    .rectangle(x, y, w, h, opts.fill ?? 0x10122b, 0.92)
    .setStrokeStyle(2, stroke, 0.8)
    .setDepth(depth)
    .setInteractive({ useHandCursor: true });

  const label = scene.add
    .text(opts.align === "left" ? x - w / 2 + 16 : x, y, text, {
      fontFamily: SERIF,
      fontSize: `${opts.size ?? FONT.body}px`,
      color,
      align: opts.align ?? "center",
      wordWrap: { width: w - 24 }
    })
    .setOrigin(opts.align === "left" ? 0 : 0.5, 0.5)
    .setDepth(depth + 1);

  const press = (on: boolean) => {
    if (!enabled) return;
    box.setFillStyle(on ? 0x2a2450 : (opts.fill ?? 0x10122b), 0.92);
    box.setStrokeStyle(2, on ? 0x3ee0c4 : stroke, on ? 1 : 0.8);
  };

  box.on("pointerdown", () => press(true));
  box.on("pointerup", () => {
    press(false);
    if (enabled) onTap();
  });
  // A finger that slides off the button must not leave it stuck lit.
  box.on("pointerout", () => press(false));
  box.on("pointerupoutside", () => press(false));

  return {
    box,
    label,
    setEnabled(on: boolean) {
      enabled = on;
      box.setAlpha(on ? 1 : 0.4);
      label.setAlpha(on ? 1 : 0.45);
      if (on) box.setInteractive({ useHandCursor: true });
      else box.disableInteractive();
    },
    setText(t: string) {
      label.setText(t);
    },
    destroy() {
      box.destroy();
      label.destroy();
    }
  };
}

export function banner(scene: Phaser.Scene, title: string): Phaser.GameObjects.Text {
  const t = scene.add.text(GAME_WIDTH / 2, 150, title, {
    fontFamily: SERIF,
    fontSize: "38px",
    color: "#E4C37A",
    stroke: "#07071A",
    strokeThickness: 6
  }).setOrigin(0.5).setDepth(80).setAlpha(0);
  scene.tweens.add({ targets: t, alpha: 1, y: 130, duration: 450, hold: 1400, yoyo: true });
  return t;
}
