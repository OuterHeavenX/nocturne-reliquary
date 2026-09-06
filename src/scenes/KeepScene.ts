import Phaser from "phaser";
import waves from "../../data/waves.json";
import enemies from "../../data/enemies.json";
import balance from "../../data/balance.json";
import { getBehavior } from "../../towers";
import { GAME_HEIGHT, GAME_WIDTH, PATH, SOCKETS } from "../config";
import { Enemy, type EnemyDef } from "../entities/Enemy";
import { Projectile } from "../entities/Projectile";
import { Tower } from "../entities/Tower";
import { audio } from "../systems/AudioSystem";
import type { MatchContext } from "../systems/MatchContext";
import { run, towerById } from "../systems/RunState";
import { getTitleKeep } from "../three/TitleKeep";
import { banner } from "../ui/Hud";
import { dist, hexToNum } from "../util/math";

const ENEMY_DEFS = enemies as EnemyDef[];
const WAVES = waves as { id: number; name: string; spawnMs: number; groups: { id: string; count: number }[] }[];
const TOWER_PICK_FALLBACK = ["crimson-lash", "void-cantor", "chrono-sage"];

export class KeepScene extends Phaser.Scene {
  towers: Tower[] = [];
  foes: Enemy[] = [];
  shots: Projectile[] = [];
  gold = balance.startingGold;
  heart = balance.startingHeart;
  maxHeart = balance.startingHeart;
  xp = 0;
  wardenLevel = 1;
  waveIndex = -1;
  inWave = false;
  pending: EnemyDef[] = [];
  spawnAcc = 0;
  spawnMs = 600;
  selectedBuild: string | null = null;
  selectedTower: Tower | null = null;
  paused = false;
  fast = false;
  kills = 0;
  goldEarned = 0;
  rangeGfx!: Phaser.GameObjects.Graphics;
  shotGfx!: Phaser.GameObjects.Graphics;
  fxGfx!: Phaser.GameObjects.Graphics;
  hudGold!: Phaser.GameObjects.Text;
  hudHeart!: Phaser.GameObjects.Text;
  hudXp!: Phaser.GameObjects.Text;
  hudWave!: Phaser.GameObjects.Text;
  panelText!: Phaser.GameObjects.Text;
  towerSprites = new Map<Tower, Phaser.GameObjects.Image>();
  enemySprites = new Map<Enemy, Phaser.GameObjects.Image>();
  texts: { x: number; y: number; text: string; color: string; life: number }[] = [];
  floatLayer!: Phaser.GameObjects.Container;
  ended = false;

  constructor() { super("keep"); }

  create(): void {
    this.ended = false;
    this.towers = []; this.foes = []; this.shots = [];
    this.towerSprites.clear(); this.enemySprites.clear();
    getTitleKeep()?.setMode("match");
    audio.startAmbience();
    this.applyRelicStart();
    this.drawKeep();
    this.rangeGfx = this.add.graphics().setDepth(8);
    this.shotGfx = this.add.graphics().setDepth(16);
    this.fxGfx = this.add.graphics().setDepth(17);
    this.floatLayer = this.add.container(0, 0).setDepth(30);
    this.buildHud();
    this.drawSockets();
    this.time.delayedCall(600, () => this.beginBuildWindow());
  }

  applyRelicStart(): void {
    this.gold = balance.startingGold;
    this.heart = balance.startingHeart;
    this.maxHeart = balance.startingHeart;
    if (run.relicId === "tithe-chalice") this.gold += 40;
    if (run.relicId === "nave-wick") { this.heart += 20; this.maxHeart += 20; }
  }

  drawKeep(): void {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0x0c1024, 1); g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.fillStyle(0x1a1430, 0.7); g.fillRect(0, 0, GAME_WIDTH, 70);
    g.fillStyle(0x120c1c, 0.8); g.fillRect(0, GAME_HEIGHT - 118, GAME_WIDTH, 118);
    g.lineStyle(38, 0x2a2438, 1); g.beginPath(); g.moveTo(PATH[0].x, PATH[0].y);
    for (const p of PATH) g.lineTo(p.x, p.y); g.strokePath();
    g.lineStyle(22, 0x3a3348, 1); g.beginPath(); g.moveTo(PATH[0].x, PATH[0].y);
    for (const p of PATH) g.lineTo(p.x, p.y); g.strokePath();
    const heart = PATH[PATH.length - 1];
    this.add.image(heart.x + 20, heart.y, "tex-heart").setDepth(6);
    this.add.text(heart.x + 20, heart.y + 42, "Reliquary Heart", { fontFamily: "Georgia, Times, serif", fontSize: "11px", color: "#3EE0C4" }).setOrigin(0.5).setDepth(6);
  }

  drawSockets(): void {
    SOCKETS.forEach((s, i) => {
      this.add.image(s.x, s.y, s.altar ? "tex-socket-altar" : "tex-socket").setDepth(5).setInteractive({ useHandCursor: true }).on("pointerdown", () => this.onSocket(i));
    });
  }

  buildHud(): void {
    this.hudWave = this.add.text(24, 14, "Vigil of Keep Vesperis", { fontFamily: "Georgia, Times, serif", fontSize: "18px", color: "#E4C37A" }).setDepth(50);
    this.hudHeart = this.add.text(24, 40, "", { fontFamily: "Trebuchet MS, sans-serif", fontSize: "14px", color: "#3EE0C4" }).setDepth(50);
    this.hudGold = this.add.text(280, 40, "", { fontFamily: "Trebuchet MS, sans-serif", fontSize: "14px", color: "#E4C37A" }).setDepth(50);
    this.hudXp = this.add.text(460, 40, "", { fontFamily: "Trebuchet MS, sans-serif", fontSize: "14px", color: "#E8DCC8" }).setDepth(50);
    const ids = run.selected.length ? run.selected : TOWER_PICK_FALLBACK;
    ids.forEach((id, i) => {
      const def = towerById(id);
      const x = 70 + i * 150; const y = GAME_HEIGHT - 58;
      const img = this.add.image(x, y - 8, `tower-${id}`).setScale(0.7).setDepth(50).setInteractive({ useHandCursor: true });
      const label = this.add.text(x, y + 28, `${def.name}\n${def.cost}g`, { fontFamily: "Trebuchet MS, sans-serif", fontSize: "11px", color: "#E8DCC8", align: "center" }).setOrigin(0.5).setDepth(50);
      img.on("pointerdown", () => { this.selectedBuild = id; this.selectedTower = null; audio.cardDeal(); this.refreshPanel(); });
    });
    this.makeBtn(GAME_WIDTH - 90, 28, "Pause", () => { this.paused = !this.paused; });
    this.makeBtn(GAME_WIDTH - 90, 68, "Fast", () => { this.fast = !this.fast; });
    this.makeBtn(GAME_WIDTH - 210, 28, "Wave", () => { if (!this.inWave) this.startNextWave(); });
    this.add.rectangle(GAME_WIDTH - 250, GAME_HEIGHT - 58, 460, 96, 0x07071a, 0.82).setStrokeStyle(1, 0xe4c37a, 0.5).setDepth(49);
    this.panelText = this.add.text(GAME_WIDTH - 470, GAME_HEIGHT - 100, "Choose a card, then a socket.", { fontFamily: "Trebuchet MS, sans-serif", fontSize: "13px", color: "#E8DCC8", wordWrap: { width: 440 } }).setDepth(50);
  }

  makeBtn(x: number, y: number, label: string, fn: () => void): void {
    const r = this.add.rectangle(x, y, 88, 28, 0x10122b, 0.9).setStrokeStyle(1, 0xe4c37a).setDepth(50).setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, { fontFamily: "Georgia, Times, serif", fontSize: "13px", color: "#E4C37A" }).setOrigin(0.5).setDepth(51);
    r.on("pointerdown", fn);
  }

  beginBuildWindow(): void {
    const next = this.waveIndex + 1;
    if (next >= WAVES.length) { this.endVigil(true); return; }
    banner(this, WAVES[next].name);
    this.hudWave.setText(`Build — next: ${WAVES[next].name}`);
    this.time.delayedCall(balance.buildWindow / (this.fast ? 3 : 1), () => {
      if (!this.inWave && this.scene.isActive("keep")) this.startNextWave();
    });
  }

  startNextWave(): void {
    this.waveIndex += 1;
    const wave = WAVES[this.waveIndex];
    if (!wave) { this.endVigil(true); return; }
    this.inWave = true; this.pending = [];
    for (const group of wave.groups) {
      const def = ENEMY_DEFS.find((e) => e.id === group.id)!;
      for (let i = 0; i < group.count; i++) this.pending.push(def);
    }
    this.spawnMs = wave.spawnMs; this.spawnAcc = 0;
    banner(this, wave.name);
    this.hudWave.setText(`Wave ${wave.id} — ${wave.name}`);
  }

  onSocket(i: number): void {
    const sock = SOCKETS[i];
    const existing = this.towers.find((t) => t.socketIndex === i);
    if (existing) { this.selectedTower = existing; this.selectedBuild = null; this.refreshPanel(); return; }
    if (!this.selectedBuild) return;
    const def = towerById(this.selectedBuild);
    if (this.gold < def.cost) return;
    this.gold -= def.cost;
    const tower = new Tower(def, sock.x, sock.y, i);
    tower.altar = !!sock.altar;
    tower.signature = def.id === run.signature;
    if (tower.signature) { tower.ap += 18; const first = def.apNodes[0]; if (first) tower.unlocked.add(first.id); }
    this.towers.push(tower);
    const spr = this.add.image(sock.x, sock.y - 10, `tower-${def.id}`).setDepth(12).setInteractive({ useHandCursor: true });
    spr.on("pointerdown", () => { this.selectedTower = tower; this.selectedBuild = null; this.refreshPanel(); });
    this.towerSprites.set(tower, spr);
    audio.place(); this.selectedTower = tower; this.refreshPanel();
  }

  match(): MatchContext {
    const leakReduction = this.towers.reduce((n, t) => n + (t.def.id === "aegis-templar" && t.has("last-vigil") ? 2 : 0), 0);
    return {
      towers: this.towers, enemies: this.foes, projectiles: this.shots,
      gold: this.gold, heart: this.heart, maxHeart: this.maxHeart, xp: this.xp,
      wardenLevel: this.wardenLevel, waveIndex: this.waveIndex, kills: this.kills,
      moon: Math.min(1, (this.waveIndex + 1) / 12), timeScale: this.fast ? balance.fastForward : 1,
      relicId: run.relicId, texts: this.texts,
      hasteMul: (tower) => {
        const sage = this.towers.find((t) => t.def.id === "chrono-sage" && t.has("haste") && dist(t, tower) < 160);
        const bannerT = this.towers.find((t) => t.def.id === "aegis-templar" && t.has("tithe") && dist(t, tower) < 140);
        return (sage ? 1.18 : 1) * (bannerT ? 1.1 : 1) * (run.relicId === "hour-splinter" ? 1.08 : 1);
      },
      leakReduction,
      grantGold: (n) => { this.gold += n; this.goldEarned += n; },
      grantXp: (n) => { this.xp += n; this.levelCheck(); },
      damageHeart: (n) => { this.heart = Math.max(0, this.heart - n); },
      healHeart: (n) => { this.heart = Math.min(this.maxHeart, this.heart + n); },
      spawnProjectile: (p) => this.shots.push(p),
      float: (x, y, text, color) => this.texts.push({ x, y, text, color, life: 0.7 })
    };
  }

  levelCheck(): void {
    const table = balance.xpToLevel as number[];
    while (this.wardenLevel < table.length && this.xp >= table[this.wardenLevel]) {
      this.wardenLevel += 1; this.gold += 12; this.towers.forEach((t) => (t.ap += 6));
      this.texts.push({ x: GAME_WIDTH / 2, y: 120, text: `Warden ${this.wardenLevel}`, color: "#3EE0C4", life: 1.2 });
    }
  }

  refreshPanel(): void {
    const t = this.selectedTower;
    if (!t) {
      const def = this.selectedBuild ? towerById(this.selectedBuild) : null;
      this.panelText.setText(def ? `${def.name}  ·  ${def.role}\n${def.line}\nCost ${def.cost}g  Range ${def.range}  Dmg ${def.damage}\nClick a socket to seat this relic.` : "Choose a card, then a socket. Click a seated tower to spend AP.");
      return;
    }
    const nodes = t.def.apNodes.map((n, i) => `${i + 1}. ${n.name} (${n.cost} AP)${t.has(n.id) ? " ✓" : ""} — ${n.desc}`).join("\n");
    this.panelText.setText(`${t.def.name}${t.signature ? "  [Signature]" : ""}${t.altar ? "  [Altar]" : ""}\nAP ${t.ap.toFixed(1)}  Dmg ${t.damage.toFixed(0)}  Range ${t.range.toFixed(0)}\nKeys 1-4 spend AP   ·   S sells (${Math.floor(t.def.cost * balance.sellRefund)}g)\n${nodes}`);
  }

  update(_: number, dtMs: number): void {
    if (this.paused || this.ended) return;
    const dt = Math.min(0.05, dtMs / 1000) * (this.fast ? balance.fastForward : 1);
    const ctx = this.match();
    if (this.inWave && this.pending.length) {
      this.spawnAcc += dt * 1000;
      while (this.spawnAcc >= this.spawnMs && this.pending.length) {
        this.spawnAcc -= this.spawnMs;
        this.spawnEnemy(this.pending.shift()!);
      }
    }
    for (const e of this.foes) {
      if (e.def.tags.includes("healer") && e.alive) {
        for (const o of this.foes) if (o !== e && o.alive && dist(e, o) < 70) o.hp = Math.min(o.maxHp, o.hp + 6 * dt);
      }
      e.update(dt);
      if (e.reached) { ctx.damageHeart(Math.max(1, e.def.leaks - ctx.leakReduction)); audio.leak(); }
    }
    for (const t of this.towers) {
      const b = getBehavior(t.def.id);
      const fireCtx = { tower: t, match: ctx, enemies: this.foes, time: this.time.now, moon: ctx.moon, float: ctx.float, spawnProjectile: ctx.spawnProjectile, healHeart: ctx.healHeart };
      b.onUpdate?.(fireCtx, dt);
      t.cooldown -= dt * ctx.hasteMul(t);
      if (t.cooldown <= 0) {
        const targets = b.acquireTargets(fireCtx);
        if (targets.length) { b.onFire(fireCtx, targets); t.cooldown = 1 / Math.max(0.08, t.fireRate); }
      }
    }
    for (const p of this.shots) p.update(dt);
    const dead = this.foes.filter((e) => !e.alive && !e.reached);
    for (const e of dead) {
      this.kills += 1; this.gold += e.def.reward; this.goldEarned += e.def.reward; this.xp += e.def.xp; this.levelCheck();
      if (run.relicId === "quicksilver-rosary" && this.kills % 10 === 0) {
        for (const o of this.foes) if (o.alive) o.takeDamage(18, "holy");
      }
      this.enemySprites.get(e)?.destroy(); this.enemySprites.delete(e);
    }
    this.foes = this.foes.filter((e) => e.alive);
    this.shots = this.shots.filter((p) => p.alive);
    if (this.inWave && this.pending.length === 0 && this.foes.length === 0) {
      this.inWave = false; this.gold += 25 + this.waveIndex * 4;
      if (this.waveIndex >= WAVES.length - 1) this.endVigil(true); else this.beginBuildWindow();
    }
    if (this.heart <= 0) this.endVigil(false);
    this.syncSprites(); this.drawShots(); this.drawRange(); this.drawFloats(dt);
    this.hudHeart.setText(`Heart ${Math.ceil(this.heart)} / ${this.maxHeart}`);
    this.hudGold.setText(`Gold ${Math.floor(this.gold)}`);
    this.hudXp.setText(`Warden ${this.wardenLevel}   XP ${Math.floor(this.xp)}   AP ${this.selectedTower ? this.selectedTower.ap.toFixed(0) : "—"}`);
    const kb = this.input.keyboard;
    if (kb && this.selectedTower) {
      const t = this.selectedTower;
      ["ONE", "TWO", "THREE", "FOUR"].forEach((key, i) => {
        if (Phaser.Input.Keyboard.JustDown(kb.addKey(key))) {
          const node = t.def.apNodes[i];
          if (node && t.spendAp(node.id, node.cost)) { audio.seal(); this.refreshPanel(); }
        }
      });
      if (Phaser.Input.Keyboard.JustDown(kb.addKey("S"))) {
        this.gold += Math.floor(t.def.cost * balance.sellRefund);
        this.towerSprites.get(t)?.destroy(); this.towerSprites.delete(t);
        this.towers = this.towers.filter((x) => x !== t); this.selectedTower = null; this.refreshPanel();
      }
    }
  }

  spawnEnemy(def: EnemyDef): void {
    const e = new Enemy({ ...def, hp: def.hp + this.waveIndex * (def.tags.includes("boss") ? 40 : 6) });
    this.foes.push(e);
    this.enemySprites.set(e, this.add.image(e.x, e.y, `enemy-${def.id}`).setDepth(14));
  }

  syncSprites(): void {
    for (const [e, spr] of this.enemySprites) { spr.setPosition(e.x, e.y); spr.setAlpha(0.55 + 0.45 * (e.hp / e.maxHp)); }
    for (const [t, spr] of this.towerSprites) spr.setPosition(t.x, t.y - 10);
  }

  drawShots(): void {
    this.shotGfx.clear();
    for (const p of this.shots) { this.shotGfx.fillStyle(p.color, 1); this.shotGfx.fillCircle(p.x, p.y, 4); }
  }

  drawRange(): void {
    this.rangeGfx.clear();
    const t = this.selectedTower; if (!t) return;
    this.rangeGfx.lineStyle(1, hexToNum(t.def.accent), 0.7); this.rangeGfx.strokeCircle(t.x, t.y, t.range);
  }

  drawFloats(dt: number): void {
    this.floatLayer.removeAll(true);
    for (const f of this.texts) {
      f.life -= dt; f.y -= 18 * dt;
      const txt = this.add.text(f.x, f.y, f.text, { fontFamily: "Trebuchet MS, sans-serif", fontSize: "12px", color: f.color });
      txt.setOrigin(0.5).setAlpha(Math.max(0, f.life)); this.floatLayer.add(txt);
    }
    this.texts = this.texts.filter((f) => f.life > 0);
  }

  endVigil(won: boolean): void {
    if (this.ended) return;
    this.ended = true;
    run.won = won; run.waveReached = this.waveIndex + 1; run.goldEarned = this.goldEarned; run.xpEarned = this.xp; run.kills = this.kills;
    if (won) audio.win(); else audio.lose();
    this.time.delayedCall(600, () => this.scene.start("results"));
  }
}
