import gsap from "gsap";
import * as THREE from "three";
import { isTouch, onStageResize, stageSize } from "../ui/Stage";

export class TitleKeep {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  moon!: THREE.Mesh;
  crystal!: THREE.Mesh;
  keep = new THREE.Group();
  clock = new THREE.Clock();
  raf = 0;
  visible = true;
  inMatch = false;
  private frame = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    // Phones render this backdrop behind the board; a 3x pixel ratio buys
    // nothing there and costs frames in the match.
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.5 : 2));
    this.renderer.setClearColor(0x07071a, 1);
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
    this.camera.position.set(0, 4.2, 16);
    this.build();
    this.resize();
    onStageResize(() => this.resize());
    window.addEventListener("resize", () => this.resize());
  }

  private build(): void {
    this.scene.fog = new THREE.FogExp2(0x07071a, 0.032);
    const hemi = new THREE.HemisphereLight(0x7a5cff, 0x1a1020, 0.85);
    this.scene.add(hemi);
    const moonLight = new THREE.PointLight(0xc43b4b, 40, 80);
    moonLight.position.set(-8, 12, -6);
    this.scene.add(moonLight);
    const gold = new THREE.PointLight(0xe4c37a, 18, 40);
    gold.position.set(2, 3, 6);
    this.scene.add(gold);
    const teal = new THREE.PointLight(0x3ee0c4, 10, 30);
    teal.position.set(0, 1.2, 3);
    this.scene.add(teal);

    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xc43b4b,
      emissive: 0xc43b4b,
      emissiveIntensity: 0.85,
      roughness: 0.4
    });
    this.moon = new THREE.Mesh(new THREE.SphereGeometry(1.8, 32, 32), moonMat);
    this.moon.position.set(-7.5, 8.2, -12);
    this.scene.add(this.moon);

    const stone = new THREE.MeshStandardMaterial({ color: 0x1c1f33, roughness: 0.86, metalness: 0.08 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xe4c37a, emissive: 0x5a4010, roughness: 0.4 });
    const glass = new THREE.MeshStandardMaterial({
      color: 0x3ee0c4,
      emissive: 0x145c52,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.85
    });

    const nave = new THREE.Mesh(new THREE.BoxGeometry(6.2, 4.2, 4.4), stone);
    nave.position.y = 1.4;
    this.keep.add(nave);
    const towerL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 7.2, 1.6), stone);
    towerL.position.set(-3.4, 2.8, 0.6);
    const towerR = towerL.clone();
    towerR.position.x = 3.4;
    this.keep.add(towerL, towerR);
    const spire = (x: number) => {
      const s = new THREE.Mesh(new THREE.ConeGeometry(1.05, 2.4, 4), goldMat);
      s.position.set(x, 7.2, 0.6);
      this.keep.add(s);
    };
    spire(-3.4);
    spire(3.4);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 2.2, 4), stone);
    roof.position.y = 4.6;
    roof.rotation.y = Math.PI / 4;
    this.keep.add(roof);
    const window = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.2, 0.2), glass);
    window.position.set(0, 1.6, 2.25);
    this.keep.add(window);
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.2), goldMat);
    door.position.set(0, 0.2, 2.3);
    this.keep.add(door);

    this.crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.55, 0),
      new THREE.MeshStandardMaterial({
        color: 0x3ee0c4,
        emissive: 0x3ee0c4,
        emissiveIntensity: 1.2,
        roughness: 0.15
      })
    );
    this.crystal.position.set(0, 0.9, 3.2);
    this.keep.add(this.crystal);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(28, 48),
      new THREE.MeshStandardMaterial({ color: 0x0b0d1c, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.8;
    this.scene.add(ground);

    this.keep.position.set(1.2, -1.1, 0);
    this.scene.add(this.keep);

    for (let i = 0; i < 40; i++) {
      const b = new THREE.Mesh(
        new THREE.SphereGeometry(0.03 + Math.random() * 0.04, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xe8dcc8 })
      );
      b.position.set((Math.random() - 0.5) * 24, Math.random() * 10, -8 - Math.random() * 10);
      this.scene.add(b);
    }

    gsap.to(this.moon.position, { y: 8.7, duration: 6, yoyo: true, repeat: -1, ease: "sine.inOut" });
  }

  setMode(mode: "title" | "cards" | "match" | "hidden"): void {
    this.visible = mode !== "hidden";
    this.inMatch = mode === "match";
    this.canvas.style.opacity = mode === "match" ? "0.28" : mode === "hidden" ? "0" : "1";
    this.canvas.style.filter = mode === "cards" ? "blur(2px) brightness(0.7)" : "none";
  }

  resize(): void {
    const { w, h } = stageSize();
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
  }

  start(): void {
    const loop = () => {
      this.raf = requestAnimationFrame(loop);
      this.frame += 1;
      if (!this.visible) return;
      // Behind the board on a phone, half-rate is indistinguishable and leaves
      // the frame budget to the vigil itself.
      if (isTouch && this.inMatch && this.frame % 2) return;
      const t = this.clock.getElapsedTime();
      this.keep.rotation.y = Math.sin(t * 0.12) * 0.18;
      this.crystal.rotation.y = t * 0.8;
      this.crystal.position.y = 0.9 + Math.sin(t * 2) * 0.08;
      this.camera.position.x = Math.sin(t * 0.08) * 0.6;
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  dispose(): void {
    cancelAnimationFrame(this.raf);
    this.renderer.dispose();
  }
}

let instance: TitleKeep | null = null;

export function getTitleKeep(): TitleKeep | null {
  return instance;
}

export function bootTitleKeep(): TitleKeep {
  const canvas = document.getElementById("three-root") as HTMLCanvasElement;
  instance = new TitleKeep(canvas);
  instance.start();
  return instance;
}
