import { GAME_HEIGHT, GAME_WIDTH } from "../config";

const ASPECT = GAME_WIDTH / GAME_HEIGHT;
const listeners: (() => void)[] = [];

let stageEl: HTMLElement | null = null;
let rotateEl: HTMLElement | null = null;

/** True on phones and tablets — anything driven by fingers rather than a mouse. */
export const isTouch =
  typeof window !== "undefined" &&
  (matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0);

/** Viewport the browser actually gives us, minus mobile URL bars and keyboards. */
function viewport(): { w: number; h: number } {
  const vv = window.visualViewport;
  return {
    w: Math.max(1, Math.round(vv?.width ?? window.innerWidth)),
    h: Math.max(1, Math.round(vv?.height ?? window.innerHeight))
  };
}

/**
 * Size the shared stage to the largest 16:9 box that fits the screen and centre
 * it. Both the Three.js backdrop and the Phaser canvas fill this box, so the
 * keep behind the play field always lines up with it.
 */
export function layoutStage(): void {
  stageEl ??= document.getElementById("stage");
  if (!stageEl) return;
  const { w, h } = viewport();
  const width = Math.min(w, Math.round(h * ASPECT));
  const height = Math.round(width / ASPECT);
  stageEl.style.width = `${width}px`;
  stageEl.style.height = `${height}px`;
  stageEl.style.left = `${Math.round((w - width) / 2)}px`;
  stageEl.style.top = `${Math.round((h - height) / 2)}px`;
  updateRotateGate(w, h);
  for (const fn of listeners) fn();
}

/**
 * Held-in-portrait gate. A 16:9 field squeezed into a portrait phone is a
 * letterboxed sliver, so ask for the turn instead of shipping an unplayable
 * board. Desktop windows that merely happen to be tall are left alone.
 */
function updateRotateGate(w: number, h: number): void {
  rotateEl ??= document.getElementById("rotate-veil");
  if (!rotateEl) return;
  const portrait = h > w;
  const smallScreen = Math.min(w, h) < 820;
  rotateEl.classList.toggle("on", isTouch && portrait && smallScreen);
}

/** Current stage size in CSS pixels — what the renderers should draw into. */
export function stageSize(): { w: number; h: number } {
  stageEl ??= document.getElementById("stage");
  return {
    w: Math.max(1, stageEl?.clientWidth ?? window.innerWidth),
    h: Math.max(1, stageEl?.clientHeight ?? window.innerHeight)
  };
}

export function onStageResize(fn: () => void): void {
  listeners.push(fn);
}

/**
 * Go fullscreen on the player's first touch so Android's URL bar stops eating
 * the board. Best effort only: iOS Safari has no element fullscreen, which is
 * what the web-app manifest and "Add to Home Screen" are for.
 */
function requestFullscreenOnce(): void {
  if (!isTouch) return;
  const el = document.documentElement;
  const go = () => {
    window.removeEventListener("pointerdown", go);
    if (document.fullscreenElement || !el.requestFullscreen) return;
    el.requestFullscreen({ navigationUI: "hide" }).catch(() => {
      /* Refused (iOS, or a permissions policy). The manifest covers that case. */
    });
  };
  window.addEventListener("pointerdown", go);
}

export function initStage(): void {
  layoutStage();
  window.addEventListener("resize", layoutStage);
  window.addEventListener("orientationchange", () => setTimeout(layoutStage, 120));
  window.visualViewport?.addEventListener("resize", layoutStage);
  window.visualViewport?.addEventListener("scroll", layoutStage);
  // Long-press context menus and double-tap zoom both steal taps from the board.
  window.addEventListener("contextmenu", (e) => e.preventDefault());
  window.addEventListener("dblclick", (e) => e.preventDefault());
  requestFullscreenOnce();
}
