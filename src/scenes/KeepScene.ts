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
import { banner, FONT, SANS, SERIF, touchButton, type TouchButton } from "../ui/Hud";
import { isTouch } from "../ui/Stage";
import { dist, hexToNum } from "../util/math";

const ENEMY_DEFS = enemies as EnemyDef[];
const WAVES = waves as { id: number; name: string; spawnMs: number; groups: { id: string; count: number }[] }[];
const TOWER_PICK_FALLBACK = ["crimson-lash", "void-cantor", "chrono-sage"];

/** Finger-sized tap radius for a socket, well past the 22px art. */
const SOCKET_HIT = 38;

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
  buildCards: { id: string; box: Phaser.GameObjects.Rectangle; cost: number }[] = [];
  towerPanel: Phaser.GameObjects.Container | null = null;
  panelTower: Tower | null = null;
  pauseBtn!: TouchButton;
  fastBtn!: TouchButton;
  waveBtn!: TouchButton;
  keys!: Record<string, Phaser.Input.Keyboard.Key>;

  constructor() { super("keep"); }

  create(): void {
    this.ended = false;
    this.towers = []; this.foes = []; this.shots = [];
    this.towerSprites.clear(); this.enemySprites.clear();
    this.buildCards = [];
    this.towerPanel = null; this.panelTower = null;
    this.selectedBuild = null; this.selectedTower = null;
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
    this.bindKeys();
    this.time.delayedCall(600, () => this.beginBuildWindow());
  }

  /**
   * Desktop shortcuts. Bound once here rather than per-frame; every action they
   * reach is also a button, so a phone loses nothing by having no keyboard.
   */
  bindKeys(): void {
    const kb = this.input.keyboard;
    if (!kb) return;
    this.keys = {
      one: kb.addKey("ONE"), two: kb.addKey("TWO"), three: kb.addKey("THREE"), four: kb.addKey("FOUR"),
      sell: kb.addKey("S"), pause: kb.addKey("P"), fast: kb.addKey("F"), wave: kb.addKey("SPACE")
    };
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
    g.fillStyle(0x1a1430, 0.7); g.fillRect(0, 0, GAME_WIDTH, 80);
    g.fillStyle(0x120c1c, 0.8); g.fillRect(0, GAME_HEIGHT - 130, GAME_WIDTH, 130);
    g.lineStyle(38, 0x2a2438, 1); g.beginPath(); g.moveTo(PATH[0].x, PATH[0].y);
    for (const p of PATH) g.lineTo(p.x, p.y); g.strokePath();
    g.lineStyle(22, 0x3a3348, 1); g.beginPath(); g.moveTo(PATH[0].x, PATH[0].y);
    for (const p of PATH) g.lineTo(p.x, p.y); g.strokePath();
    const heart = PATH[PATH.length - 1];
    this.add.image(heart.x + 20, heart.y, "tex-heart").setDepth(6);
    this.add.text(heart.x + 20, heart.y + 46, "Reliquary Heart", { fontFamily: SERIF, fontSize: `${FONT.tiny}px`, color: "#3EE0C4" }).setOrigin(0.5).setDepth(6);
  }

  drawSockets(): void {
    SOCKETS.forEach((s, i) => {
      const img = this.add.image(s.x, s.y, s.altar ? "tex-socket-altar" : "tex-socket").setDepth(5);
      // Hit circle rather than the sprite bounds: fingers are wider than the art.
      const r = img.width / 2;
      img.setInteractive(new Phaser.Geom.Circle(r, r, SOCKET_HIT), Phaser.Geom.Circle.Contains);
      img.input!.cursor = "pointer";
      img.on("pointerdown", () => this.onSocket(i));
    });
  }

  buildHud(): void {
    this.hudWave = this.add.text(20, 10, "Vigil of Keep Vesperis", { fontFamily: SERIF, fontSize: `${FONT.label}px`, color: "#E4C37A" }).setDepth(50);
    this.hudHeart = this.add.text(20, 44, "", { fontFamily: SANS, fontSize: `${FONT.body}px`, color: "#3EE0C4" }).setDepth(50);
    this.hudGold = this.add.text(280, 44, "", { fontFamily: SANS, fontSize: `${FONT.body}px`, color: "#E4C37A" }).setDepth(50);
    this.hudXp = this.add.text(490, 44, "", { fontFamily: SANS, fontSize: `${FONT.body}px`, color: "#E8DCC8" }).setDepth(50);

    const ids = run.selected.length ? run.selected : TOWER_PICK_FALLBACK;
    ids.forEach((id, i) => {
      const def = towerById(id);
      const x = 96 + i * 178;
      const y = GAME_HEIGHT - 62;
      const box = this.add.rectangle(x, y, 168, 112, 0x10122b, 0.7)
        .setStrokeStyle(2, 0xe4c37a, 0.45).setDepth(49)
        .setInteractive({ useHandCursor: true });
      this.add.image(x, y - 30, `tower-${id}`).setScale(0.9).setDepth(50);
      this.add.text(x, y + 2, `${def.name}\n${def.cost}g`, {
        fontFamily: SERIF, fontSize: `${FONT.tiny}px`, color: "#E4C37A",
        align: "center", wordWrap: { width: 162 }, lineSpacing: 2
      }).setOrigin(0.5, 0).setDepth(50);
      box.on("pointerdown", () => {
        this.selectedBuild = this.selectedBuild === id ? null : id;
        this.closeTowerPanel();
        this.selectedTower = null;
        audio.cardDeal();
        this.refreshPanel();
      });
      this.buildCards.push({ id, box, cost: def.cost });
    });

    this.waveBtn = touchButton(this, 972, 38, "Wave", () => { if (!this.inWave) this.startNextWave(); }, { w: 112, h: 54, size: FONT.small });
    this.fastBtn = touchButton(this, 1092, 38, "Fast", () => { this.fast = !this.fast; this.refreshToggles(); }, { w: 112, h: 54, size: FONT.small });
    this.pauseBtn = touchButton(this, 1212, 38, "Pause", () => { this.paused = !this.paused; this.refreshToggles(); }, { w: 112, h: 54, size: FONT.small });

    this.panelText = this.add.text(600, GAME_HEIGHT - 106, "", {
      fontFamily: SANS, fontSize: `${FONT.small}px`, color: "#E8DCC8", wordWrap: { width: 660 }, lineSpacing: 4
    }).setDepth(50);
    this.refreshPanel();
  }

  refreshToggles(): void {
    this.pauseBtn.setText(this.paused ? "Resume" : "Pause");
    this.fastBtn.setText(this.fast ? "Fast ▶▶" : "Fast");
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
    if (existing) { this.selectTower(existing); return; }
    if (!this.selectedBuild) return;
    const def = towerById(this.selectedBuild);
    if (this.gold < def.cost) { this.flash("Not enough gold", "#C43B4B"); return; }
    this.gold -= def.cost;
    const tower = new Tower(def, sock.x, sock.y, i);
    tower.altar = !!sock.altar;
    tower.signature = def.id === run.signature;
    if (tower.signature) { tower.ap += 18; const first = def.apNodes[0]; if (first) tower.unlocked.add(first.id); }
    this.towers.push(tower);
    const spr = this.add.image(sock.x, sock.y - 10, `tower-${def.id}`).setDepth(12);
    const r = spr.width / 2;
    spr.setInteractive(new Phaser.Geom.Circle(r, spr.height / 2, SOCKET_HIT), Phaser.Geom.Circle.Contains);
    spr.input!.cursor = "pointer";
    spr.on("pointerdown", () => this.selectTower(tower));
    this.towerSprites.set(tower, spr);
    audio.place();
    this.selectTower(tower);
  }

  selectTower(tower: Tower): void {
    this.selectedTower = tower;
    this.selectedBuild = null;
    this.openTowerPanel(tower);
    this.refreshPanel();
  }

  flash(msg: string, color: string): void {
    this.texts.push({ x: GAME_WIDTH / 2, y: 200, text: msg, color, life: 1.1 });
  }

  // ---- Tower panel -------------------------------------------------------
  // Every upgrade used to be a number key, which a phone does not have. The
  // panel gives each AP node and the sell action a real button, and sits on the
  // side of the board the selected tower is not, so it never hides its own tower.

  closeTowerPanel(): void {
    this.towerPanel?.destroy(true);
    this.towerPanel = null;
    this.panelTower = null;
  }

  openTowerPanel(tower: Tower): void {
    this.closeTowerPanel();
    this.panelTower = tower;
    const w = 430;
    const h = 386;
    const x = tower.x > GAME_WIDTH / 2 ? 20 + w / 2 : GAME_WIDTH - 20 - w / 2;
    const y = 300;
    const c = this.add.container(x, y).setDepth(70);
    this.towerPanel = c;

    c.add(this.add.rectangle(0, 0, w, h, 0x07071a, 0.94).setStrokeStyle(2, 0xe4c37a, 0.85));
    const title = this.add.text(-w / 2 + 18, -h / 2 + 14, "", {
      fontFamily: SERIF, fontSize: `${FONT.label}px`, color: "#E4C37A", wordWrap: { width: w - 80 }
    });
    const stats = this.add.text(-w / 2 + 18, -h / 2 + 52, "", {
      fontFamily: SANS, fontSize: `${FONT.tiny}px`, color: "#E8DCC8"
    });
    c.add([title, stats]);

    const close = touchButton(this, x + w / 2 - 34, y - h / 2 + 26, "✕", () => {
      this.selectedTower = null;
      this.closeTowerPanel();
      this.refreshPanel();
    }, { w: 48, h: 44, size: FONT.small, fill: 0x07071a, depth: 71 });
    c.add([close.box, close.label]);
    close.box.setPosition(w / 2 - 34, -h / 2 + 26);
    close.label.setPosition(w / 2 - 34, -h / 2 + 26);

    const nodeBtns: TouchButton[] = [];
    tower.def.apNodes.forEach((node, i) => {
      const by = -h / 2 + 96 + i * 58;
      const btn = touchButton(this, 0, 0, "", () => {
        if (tower.spendAp(node.id, node.cost)) {
          audio.seal();
          this.flash(`${node.name} bound`, "#3EE0C4");
          update();
          this.refreshPanel();
        }
      }, { w: w - 36, h: 50, size: FONT.tiny, fill: 0x10122b, align: "left", depth: 71 });
      btn.box.setPosition(0, by);
      btn.label.setPosition(-w / 2 + 34, by);
      c.add([btn.box, btn.label]);
      nodeBtns.push(btn);
    });

    const sell = touchButton(this, 0, 0, "", () => {
      this.gold += Math.floor(tower.def.cost * balance.sellRefund);
      this.towerSprites.get(tower)?.destroy();
      this.towerSprites.delete(tower);
      this.towers = this.towers.filter((x) => x !== tower);
      this.selectedTower = null;
      audio.tone(220, 0.12, "sawtooth", 0.04);
      this.closeTowerPanel();
      this.refreshPanel();
    }, { w: w - 36, h: 50, size: FONT.tiny, fill: 0x2a1220, stroke: 0xc43b4b, color: "#E8B0B8", depth: 71 });
    sell.box.setPosition(0, h / 2 - 36);
    sell.label.setPosition(0, h / 2 - 36);
    c.add([sell.box, sell.label]);

    const update = () => {
      const tags = `${tower.signature ? "  [Signature]" : ""}${tower.altar ? "  [Altar]" : ""}`;
      title.setText(`${tower.def.name}${tags}`);
      stats.setText(`AP ${tower.ap.toFixed(0)}   ·   Dmg ${tower.damage.toFixed(0)}   ·   Range ${tower.range.toFixed(0)}`);
      tower.def.apNodes.forEach((node, i) => {
        const owned = tower.has(node.id);
        const afford = tower.ap >= node.cost;
        nodeBtns[i].setText(owned ? `✓ ${node.name}` : `${node.name}   ${node.cost} AP`);
        nodeBtns[i].setEnabled(!owned && afford);
        nodeBtns[i].box.setStrokeStyle(2, owned ? 0x3ee0c4 : afford ? 0xe4c37a : 0x3a3f4c, owned ? 1 : 0.8);
      });
      sell.setText(`Sell  ·  +${Math.floor(tower.def.cost * balance.sellRefund)}g`);
    };
    update();
    c.setData("update", update);
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
      this.texts.push({ x: GAME_WIDTH / 2, y: 200, text: `Warden ${this.wardenLevel}`, color: "#3EE0C4", life: 1.2 });
    }
  }

  refreshPanel(): void {
    for (const card of this.buildCards) {
      const on = this.selectedBuild === card.id;
      const afford = this.gold >= card.cost;
      card.box.setStrokeStyle(on ? 3 : 2, on ? 0x3ee0c4 : afford ? 0xe4c37a : 0x3a3f4c, on ? 1 : 0.45);
      card.box.setFillStyle(on ? 0x2a2450 : 0x10122b, on ? 0.85 : 0.7);
    }
    const t = this.selectedTower;
    if (t) {
      this.panelText.setText(`${t.def.name} seated. Spend AP in the panel${isTouch ? "" : ", or press 1-4 · S to sell"}.`);
      return;
    }
    const def = this.selectedBuild ? towerById(this.selectedBuild) : null;
    const verb = isTouch ? "Tap" : "Click";
    this.panelText.setText(def
      ? `${def.name}  ·  ${def.role}\n${def.line}\nCost ${def.cost}g   Range ${def.range}   Dmg ${def.damage}\n${verb} a socket to seat this relic.`
      : `${verb} a card, then a socket. ${verb} a seated tower to spend AP.`);
  }

  update(_: number, dtMs: number): void {
    this.readKeys();
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
    this.hudXp.setText(`Warden ${this.wardenLevel}   XP ${Math.floor(this.xp)}`);
    this.waveBtn.setEnabled(!this.inWave);
    // AP accrues during the wave, so affordability in the open panel is live.
    (this.towerPanel?.getData("update") as (() => void) | undefined)?.();
    this.refreshBuildCards();
  }

  refreshBuildCards(): void {
    for (const card of this.buildCards) {
      if (this.selectedBuild === card.id) continue;
      card.box.setStrokeStyle(2, this.gold >= card.cost ? 0xe4c37a : 0x3a3f4c, 0.45);
    }
  }

  readKeys(): void {
    const k = this.keys;
    if (!k) return;
    if (Phaser.Input.Keyboard.JustDown(k.pause)) { this.paused = !this.paused; this.refreshToggles(); }
    if (Phaser.Input.Keyboard.JustDown(k.fast)) { this.fast = !this.fast; this.refreshToggles(); }
    if (Phaser.Input.Keyboard.JustDown(k.wave) && !this.inWave) this.startNextWave();
    const t = this.selectedTower;
    if (!t) return;
    [k.one, k.two, k.three, k.four].forEach((key, i) => {
      if (Phaser.Input.Keyboard.JustDown(key)) {
        const node = t.def.apNodes[i];
        if (node && t.spendAp(node.id, node.cost)) {
          audio.seal();
          (this.towerPanel?.getData("update") as (() => void) | undefined)?.();
          this.refreshPanel();
        }
      }
    });
    if (Phaser.Input.Keyboard.JustDown(k.sell)) {
      this.gold += Math.floor(t.def.cost * balance.sellRefund);
      this.towerSprites.get(t)?.destroy(); this.towerSprites.delete(t);
      this.towers = this.towers.filter((x) => x !== t);
      this.selectedTower = null;
      this.closeTowerPanel();
      this.refreshPanel();
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
    for (const p of this.shots) { this.shotGfx.fillStyle(p.color, 1); this.shotGfx.fillCircle(p.x, p.y, 5); }
  }

  drawRange(): void {
    this.rangeGfx.clear();
    const t = this.selectedTower; if (!t) return;
    this.rangeGfx.fillStyle(hexToNum(t.def.accent), 0.07); this.rangeGfx.fillCircle(t.x, t.y, t.range);
    this.rangeGfx.lineStyle(2, hexToNum(t.def.accent), 0.8); this.rangeGfx.strokeCircle(t.x, t.y, t.range);
  }

  drawFloats(dt: number): void {
    this.floatLayer.removeAll(true);
    for (const f of this.texts) {
      f.life -= dt; f.y -= 18 * dt;
      const txt = this.add.text(f.x, f.y, f.text, { fontFamily: SANS, fontSize: `${FONT.tiny}px`, color: f.color });
      txt.setOrigin(0.5).setAlpha(Math.max(0, f.life)); this.floatLayer.add(txt);
    }
    this.texts = this.texts.filter((f) => f.life > 0);
  }

  endVigil(won: boolean): void {
    if (this.ended) return;
    this.ended = true;
    this.closeTowerPanel();
    run.won = won; run.waveReached = this.waveIndex + 1; run.goldEarned = this.goldEarned; run.xpEarned = this.xp; run.kills = this.kills;
    if (won) audio.win(); else audio.lose();
    this.time.delayedCall(600, () => this.scene.start("results"));
  }
}
