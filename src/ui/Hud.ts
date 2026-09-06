import Phaser from "phaser";
import { GAME_WIDTH } from "../config";

export function goldText(scene: Phaser.Scene, x: number, y: number, text: string, size = 18): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    fontFamily: "Georgia, Times, serif",
    fontSize: `${size}px`,
    color: "#E4C37A"
  }).setDepth(50);
}

export function boneText(scene: Phaser.Scene, x: number, y: number, text: string, size = 16): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    fontFamily: "Trebuchet MS, sans-serif",
    fontSize: `${size}px`,
    color: "#E8DCC8"
  }).setDepth(50);
}

export function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, alpha = 0.78): Phaser.GameObjects.Rectangle {
  return scene.add.rectangle(x, y, w, h, 0x07071a, alpha).setStrokeStyle(2, 0xe4c37a, 0.7).setDepth(40).setOrigin(0, 0);
}

export function banner(scene: Phaser.Scene, title: string): Phaser.GameObjects.Text {
  const t = scene.add.text(GAME_WIDTH / 2, 90, title, {
    fontFamily: "Georgia, Times, serif",
    fontSize: "32px",
    color: "#E4C37A",
    stroke: "#07071A",
    strokeThickness: 6
  }).setOrigin(0.5).setDepth(80).setAlpha(0);
  scene.tweens.add({ targets: t, alpha: 1, y: 70, duration: 450, hold: 1400, yoyo: true });
  return t;
}
