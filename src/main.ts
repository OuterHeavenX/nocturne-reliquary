import { createGame } from "./game";
import { audio } from "./systems/AudioSystem";
import { bootTitleKeep } from "./three/TitleKeep";

bootTitleKeep();
createGame();

const unlock = () => {
  audio.resume();
  audio.startAmbience();
  window.removeEventListener("pointerdown", unlock);
};
window.addEventListener("pointerdown", unlock);
