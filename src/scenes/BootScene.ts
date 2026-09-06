import Phaser from "phaser";
import { generateTextures } from "../gfx/ProceduralSprites";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  create(): void {
    generateTextures(this);
    const veil = document.getElementById("boot-veil");
    if (veil) {
      veil.classList.add("hidden");
      setTimeout(() => veil.remove(), 900);
    }
    this.scene.start("title");
  }
}
