export class AudioSystem {
  private ctx: AudioContext | null = null;
  musicGain: GainNode | null = null;
  sfxGain: GainNode | null = null;
  musicVol = 0.22;
  sfxVol = 0.35;
  muted = false;
  private musicTimer: number | null = null;

  ensure(): AudioContext {
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVol;
      this.sfxGain.gain.value = this.sfxVol;
      this.musicGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  resume(): void {
    void this.ensure().resume();
  }

  tone(freq: number, dur = 0.12, type: OscillatorType = "sine", gain = 0.08, dest: "sfx" | "music" = "sfx"): void {
    if (this.muted) return;
    const ctx = this.ensure();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(g);
    g.connect(dest === "music" ? this.musicGain! : this.sfxGain!);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.02);
  }

  cardDeal(): void {
    this.tone(520, 0.1, "triangle", 0.05);
    this.tone(780, 0.14, "sine", 0.04);
  }

  place(): void {
    this.tone(220, 0.16, "square", 0.05);
    this.tone(440, 0.2, "sine", 0.04);
  }

  hit(): void {
    this.tone(180 + Math.random() * 80, 0.05, "square", 0.03);
  }

  whip(): void {
    this.tone(140, 0.08, "sawtooth", 0.04);
    this.tone(620, 0.06, "triangle", 0.03);
  }

  slam(): void {
    this.tone(70, 0.18, "sine", 0.1);
  }

  seal(): void {
    this.tone(196, 0.25, "sine", 0.06);
    this.tone(392, 0.3, "triangle", 0.05);
    this.tone(588, 0.35, "sine", 0.04);
  }

  leak(): void {
    this.tone(90, 0.3, "sawtooth", 0.06);
  }

  win(): void {
    [392, 494, 587, 784].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, "triangle", 0.05), i * 120));
  }

  lose(): void {
    [330, 262, 196].forEach((f, i) => setTimeout(() => this.tone(f, 0.28, "sine", 0.06), i * 160));
  }

  startAmbience(): void {
    this.resume();
    if (this.musicTimer != null) return;
    const pulse = () => {
      if (!this.muted) {
        this.tone(98, 1.6, "sine", 0.03, "music");
        this.tone(147, 1.8, "triangle", 0.018, "music");
      }
      this.musicTimer = window.setTimeout(pulse, 2400);
    };
    pulse();
  }

  stopAmbience(): void {
    if (this.musicTimer != null) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const audio = new AudioSystem();
