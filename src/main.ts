import { createGame } from "./game";
import { audio } from "./systems/AudioSystem";
import { bootTitleKeep } from "./three/TitleKeep";
import { initStage } from "./ui/Stage";

initStage();

try {
  bootTitleKeep();
} catch (err) {
  console.warn("Title keep (Three.js) failed; Phaser vigil still starts.", err);
}

createGame();

const unlock = () => {
  audio.resume();
  audio.startAmbience();
  window.removeEventListener("pointerdown", unlock);
};
window.addEventListener("pointerdown", unlock);
