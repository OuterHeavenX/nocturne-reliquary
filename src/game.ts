import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, PALETTE } from "./config";
import { BootScene } from "./scenes/BootScene";
import { CardSelectScene } from "./scenes/CardSelectScene";
import { CodexScene } from "./scenes/CodexScene";
import { KeepScene } from "./scenes/KeepScene";
import { ResultsScene } from "./scenes/ResultsScene";
import { TitleScene } from "./scenes/TitleScene";

export function createGame(): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: "phaser-root",
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: PALETTE.night,
    transparent: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, TitleScene, CardSelectScene, CodexScene, KeepScene, ResultsScene]
  });
}
