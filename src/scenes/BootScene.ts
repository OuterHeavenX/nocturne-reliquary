import Phaser from "phaser";
import { generateTextures } from "../gfx/ProceduralSprites";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  create(): void {
    try {
      generateTextures(this);
    } catch (err) {
      console.warn("Procedural sprites failed", err);
    }
    const veil = document.getElementById("boot-veil");
    if (veil) {
      veil.classList.add("hidden");
      setTimeout(() => veil.remove(), 700);
    }
    this.scene.start("title");
  }
}
