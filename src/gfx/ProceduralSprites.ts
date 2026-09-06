import Phaser from "phaser";

function circle(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, color: number, a = 1) {
  g.fillStyle(color, a);
  g.fillCircle(x, y, r);
}

export function generateTextures(scene: Phaser.Scene): void {
  const make = (key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) => {
    if (scene.textures.exists(key)) return;
    const g = scene.add.graphics();
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  };

  make("tex-socket", 64, 64, (g) => {
    g.lineStyle(2, 0xe4c37a, 0.85);
    g.strokeCircle(32, 32, 22);
    g.lineStyle(1, 0x3ee0c4, 0.5);
    g.strokeCircle(32, 32, 14);
    g.fillStyle(0xe4c37a, 0.12);
    g.fillCircle(32, 32, 22);
  });

  make("tex-socket-altar", 72, 72, (g) => {
    g.lineStyle(3, 0x3ee0c4, 0.95);
    g.strokeCircle(36, 36, 26);
    g.lineStyle(1, 0xe4c37a, 0.8);
    g.strokeCircle(36, 36, 16);
    g.fillStyle(0x3ee0c4, 0.16);
    g.fillCircle(36, 36, 26);
  });

  make("tex-heart", 80, 80, (g) => {
    circle(g, 40, 40, 28, 0x3ee0c4, 0.25);
    circle(g, 40, 40, 16, 0xe4c37a, 0.9);
    g.fillStyle(0xffffff, 0.7);
    g.fillTriangle(40, 22, 48, 40, 32, 40);
    g.fillTriangle(40, 58, 48, 40, 32, 40);
  });

  const towers: [string, number, number][] = [
    ["crimson-lash", 0xc43b4b, 0xe4c37a],
    ["void-cantor", 0x7a5cff, 0xb07cff],
    ["sanctum-cantor", 0x3ee0c4, 0xf3e6b4],
    ["sky-piercer", 0x4aa3ff, 0xe8dcc8],
    ["eidolon-binder", 0x9b6bff, 0x3ee0c4],
    ["moonshade-duelist", 0xc9d4e8, 0xc43b4b],
    ["aegis-templar", 0xe4c37a, 0x3a3f4c],
    ["chrono-sage", 0xc9a27a, 0x7ecbff]
  ];

  for (const [id, main, accent] of towers) {
    make(`tower-${id}`, 56, 72, (g) => {
      g.fillStyle(0x10122b, 0.9);
      g.fillRoundedRect(10, 28, 36, 36, 6);
      g.fillStyle(main, 1);
      g.fillRoundedRect(14, 18, 28, 34, 5);
      circle(g, 28, 16, 12, accent, 1);
      g.fillStyle(accent, 0.9);
      g.fillRect(24, 50, 8, 16);
    });
    make(`card-${id}`, 220, 320, (g) => {
      g.fillStyle(0x120c1c, 1);
      g.fillRoundedRect(0, 0, 220, 320, 14);
      g.lineStyle(3, accent, 1);
      g.strokeRoundedRect(4, 4, 212, 312, 12);
      g.fillStyle(main, 1);
      g.fillRoundedRect(24, 28, 172, 150, 10);
      circle(g, 110, 100, 44, accent, 0.85);
    });
  }

  const foes: [string, number][] = [
    ["thrall", 0x8a7a72],
    ["bat-choir", 0x6b4a7a],
    ["plate-penitent", 0x6d7380],
    ["marble-coil", 0xcfc6b4],
    ["blood-runner", 0xc43b4b],
    ["choir-healer", 0xe8dcc8],
    ["clock-ward", 0xc9a27a],
    ["moon-prince", 0xc43b4b]
  ];
  for (const [id, color] of foes) {
    const size = id === "moon-prince" ? 48 : id === "clock-ward" || id === "marble-coil" ? 36 : 28;
    make(`enemy-${id}`, size, size, (g) => {
      circle(g, size / 2, size / 2, size / 2 - 1, color, 1);
      g.fillStyle(0x07071a, 0.55);
      g.fillCircle(size / 2 - 5, size / 2 - 3, 3);
      g.fillCircle(size / 2 + 5, size / 2 - 3, 3);
    });
  }
}
