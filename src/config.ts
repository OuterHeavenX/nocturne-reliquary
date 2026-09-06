export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const PALETTE = {
  night: 0x07071a,
  gold: 0xe4c37a,
  crimson: 0xc43b4b,
  teal: 0x3ee0c4,
  violet: 0x7a5cff,
  bone: 0xe8dcc8,
  iron: 0x3a3f4c,
  navy: 0x10122b
};

export const PATH: { x: number; y: number }[] = [
  { x: 40, y: 430 },
  { x: 220, y: 430 },
  { x: 220, y: 180 },
  { x: 470, y: 180 },
  { x: 470, y: 560 },
  { x: 760, y: 560 },
  { x: 760, y: 250 },
  { x: 1040, y: 250 },
  { x: 1040, y: 400 },
  { x: 1210, y: 400 }
];

export const SOCKETS: { x: number; y: number; altar?: boolean }[] = [
  { x: 140, y: 350 },
  { x: 140, y: 510 },
  { x: 300, y: 430 },
  { x: 300, y: 250 },
  { x: 300, y: 120 },
  { x: 390, y: 250, altar: true },
  { x: 560, y: 180 },
  { x: 560, y: 330 },
  { x: 390, y: 560 },
  { x: 560, y: 640 },
  { x: 670, y: 470 },
  { x: 850, y: 560 },
  { x: 850, y: 400, altar: true },
  { x: 670, y: 250 },
  { x: 850, y: 180 },
  { x: 960, y: 330 },
  { x: 1140, y: 250 },
  { x: 1140, y: 490 },
  { x: 960, y: 490 },
  { x: 1210, y: 520 }
];
