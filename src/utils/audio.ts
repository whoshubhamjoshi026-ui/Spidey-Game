// Advanced Web Audio API Synthesizer for AAA Superhero Arcade Sound FX & Music

class SoundSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicInterval: number | null = null;
  public isMusicPlaying: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
      this.isMusicPlaying = false;
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Spider-Man Web "THWIP!" Sound Effect (Enhanced tension whip)
  public playThwip(isMega: boolean = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isMega ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(isMega ? 1600 : 1350, now);
    osc.frequency.exponentialRampToValueAtTime(isMega ? 120 : 180, now + 0.15);

    gain.gain.setValueAtTime(isMega ? 0.45 : 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);

    // Whizzing cord noise
    this.playNoise(isMega ? 0.14 : 0.09, isMega ? 0.25 : 0.18);
  }

  // Superhero Jump sound effect with whoosh
  public playJump(isDoubleJump: boolean = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const startFreq = isDoubleJump ? 380 : 200;
    const endFreq = isDoubleJump ? 840 : 540;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.18);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Destruction / Explosion with Sub-bass Punch
  public playExplosion() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Sub-bass thump
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(130, now);
    subOsc.frequency.exponentialRampToValueAtTime(25, now + 0.35);

    subGain.gain.setValueAtTime(0.5, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.35);

    // Mid crackle
    const midOsc = this.ctx.createOscillator();
    const midGain = this.ctx.createGain();
    midOsc.type = 'sawtooth';
    midOsc.frequency.setValueAtTime(320, now);
    midOsc.frequency.exponentialRampToValueAtTime(40, now + 0.2);

    midGain.gain.setValueAtTime(0.3, now);
    midGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    midOsc.connect(midGain);
    midGain.connect(this.ctx.destination);
    midOsc.start(now);
    midOsc.stop(now + 0.2);

    // Noise burst
    this.playNoise(0.28, 0.4);
  }

  // Coin and Spider-Token pickup
  public playCoin(isSuper: boolean = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const f1 = isSuper ? 1318.51 : 987.77; // E6 or B5
    const f2 = isSuper ? 1760.00 : 1318.51; // A6 or E6
    const f3 = isSuper ? 2093.00 : 1567.98; // C7 or G6

    osc.frequency.setValueAtTime(f1, now);
    osc.frequency.setValueAtTime(f2, now + 0.06);
    if (isSuper) {
      osc.frequency.setValueAtTime(f3, now + 0.12);
    }

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isSuper ? 0.28 : 0.2));

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + (isSuper ? 0.28 : 0.2));
  }

  // Combo Streak Fanfare
  public playCombo(comboCount: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const baseFreq = 440 * Math.pow(1.059, Math.min(18, comboCount * 2));

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.setValueAtTime(baseFreq * 1.25, now + 0.08);
    osc.frequency.setValueAtTime(baseFreq * 1.5, now + 0.16);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Ultimate Venom Blast / Screen Nuke Sound
  public playUltimateBlast() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Rising siren before blast
    const riseOsc = this.ctx.createOscillator();
    const riseGain = this.ctx.createGain();
    riseOsc.type = 'sawtooth';
    riseOsc.frequency.setValueAtTime(200, now);
    riseOsc.frequency.exponentialRampToValueAtTime(1400, now + 0.25);

    riseGain.gain.setValueAtTime(0.4, now);
    riseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    riseOsc.connect(riseGain);
    riseGain.connect(this.ctx.destination);
    riseOsc.start(now);
    riseOsc.stop(now + 0.25);

    // Huge Boom right after
    setTimeout(() => {
      this.playExplosion();
      this.playNoise(0.5, 0.5);
    }, 200);
  }

  // Spider-Sense tingling warning sound (dynamic pulses)
  public playSpiderSense() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.setValueAtTime(1250, now + 0.04);
    osc.frequency.setValueAtTime(920, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  // Electric Zap / Shock
  public playZap() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.setValueAtTime(150, now + 0.1);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Shield Break or PowerUp activate
  public playPowerUp() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A major arpeggio
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const time = now + idx * 0.05;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(time);
      osc.stop(time + 0.18);
    });
  }

  // Boss / Super-Villain Incoming Siren Alarm
  public playBossWarning() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.linearRampToValueAtTime(740, now + 0.2);
    osc.frequency.linearRampToValueAtTime(380, now + 0.4);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  // Shield Shatter FX
  public playShieldBreak() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.22);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);

    this.playNoise(0.2, 0.35);
  }

  // Spider-Man Iconic Superhero Theme Song Synthesizer (Plays on Epic Boss Battles, High Combos & Level Victory)
  private spiderThemeNodes: { oscs: OscillatorNode[]; gains: GainNode[] } = { oscs: [], gains: [] };
  private spiderThemeTimer: number | null = null;
  public isThemePlaying: boolean = false;

  public playSpiderManThemeSong(onComplete?: () => void) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.stopSpiderManThemeSong();
    this.isThemePlaying = true;

    const ctx = this.ctx;
    const now = ctx.currentTime + 0.05;

    // Classic 1960s/Animated Series Iconic Melody:
    // C4 - Eb4 - F4 | C4 - Eb4 - F4 | Ab4 - G4 - F4 - Eb4 - C4 | Eb4 - F4 - G4 - F4 - Eb4 - C4 | C4 - Eb4 - F4
    const melody = [
      // Measure 1: "Spi-der-Man"
      { note: 261.63, dur: 0.22, time: 0.0 },  // C4
      { note: 311.13, dur: 0.22, time: 0.26 }, // Eb4
      { note: 349.23, dur: 0.60, time: 0.52 }, // F4
      
      // Measure 2: "Spi-der-Man"
      { note: 261.63, dur: 0.22, time: 1.25 }, // C4
      { note: 311.13, dur: 0.22, time: 1.51 }, // Eb4
      { note: 349.23, dur: 0.60, time: 1.77 }, // F4

      // Measure 3: "Does what-ev-er a spi-der can"
      { note: 415.30, dur: 0.25, time: 2.50 }, // Ab4
      { note: 392.00, dur: 0.25, time: 2.80 }, // G4
      { note: 349.23, dur: 0.25, time: 3.10 }, // F4
      { note: 311.13, dur: 0.28, time: 3.40 }, // Eb4
      { note: 261.63, dur: 0.65, time: 3.75 }, // C4

      // Measure 4: "Spins a web, an-y size"
      { note: 311.13, dur: 0.25, time: 4.55 }, // Eb4
      { note: 349.23, dur: 0.25, time: 4.85 }, // F4
      { note: 392.00, dur: 0.25, time: 5.15 }, // G4
      { note: 349.23, dur: 0.25, time: 5.45 }, // F4
      { note: 311.13, dur: 0.28, time: 5.75 }, // Eb4
      { note: 261.63, dur: 0.65, time: 6.10 }, // C4

      // Measure 5: "Look out! Here comes the Spi-der-Man!"
      { note: 261.63, dur: 0.22, time: 6.90 }, // C4
      { note: 311.13, dur: 0.22, time: 7.15 }, // Eb4
      { note: 349.23, dur: 0.85, time: 7.40 }, // F4
    ];

    // Bassline riff accompanying the melody
    const bassline = [
      { note: 130.81, time: 0.0, dur: 0.4 },  // C3
      { note: 155.56, time: 0.5, dur: 0.4 },  // Eb3
      { note: 174.61, time: 1.0, dur: 0.4 },  // F3
      { note: 130.81, time: 1.5, dur: 0.4 },  // C3
      { note: 155.56, time: 2.0, dur: 0.4 },  // Eb3
      { note: 174.61, time: 2.5, dur: 0.4 },  // F3
      { note: 207.65, time: 3.0, dur: 0.4 },  // Ab3
      { note: 196.00, time: 3.5, dur: 0.4 },  // G3
      { note: 174.61, time: 4.0, dur: 0.4 },  // F3
      { note: 155.56, time: 4.5, dur: 0.4 },  // Eb3
      { note: 130.81, time: 5.0, dur: 0.4 },  // C3
      { note: 174.61, time: 6.0, dur: 0.4 },  // F3
      { note: 130.81, time: 7.0, dur: 0.8 },  // C3
    ];

    const totalDuration = 8.5;

    // 1. Play Lead Brass Synth
    melody.forEach((item) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(item.note, now + item.time);

      // Low pass filter for warm superhero horn brass punch
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, now + item.time);
      filter.frequency.exponentialRampToValueAtTime(800, now + item.time + item.dur);

      gain.gain.setValueAtTime(0.001, now + item.time);
      gain.gain.linearRampToValueAtTime(0.24, now + item.time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + item.time + item.dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + item.time);
      osc.stop(now + item.time + item.dur);

      this.spiderThemeNodes.oscs.push(osc);
      this.spiderThemeNodes.gains.push(gain);
    });

    // 2. Play Heroic Bassline
    bassline.forEach((item) => {
      const bOsc = ctx.createOscillator();
      const bGain = ctx.createGain();

      bOsc.type = 'triangle';
      bOsc.frequency.setValueAtTime(item.note, now + item.time);

      bGain.gain.setValueAtTime(0.001, now + item.time);
      bGain.gain.linearRampToValueAtTime(0.28, now + item.time + 0.03);
      bGain.gain.exponentialRampToValueAtTime(0.001, now + item.time + item.dur);

      bOsc.connect(bGain);
      bGain.connect(ctx.destination);

      bOsc.start(now + item.time);
      bOsc.stop(now + item.time + item.dur);

      this.spiderThemeNodes.oscs.push(bOsc);
      this.spiderThemeNodes.gains.push(bGain);
    });

    this.spiderThemeTimer = window.setTimeout(() => {
      this.isThemePlaying = false;
      if (onComplete) onComplete();
    }, totalDuration * 1000);
  }

  public stopSpiderManThemeSong() {
    if (this.spiderThemeTimer) {
      clearTimeout(this.spiderThemeTimer);
      this.spiderThemeTimer = null;
    }
    this.spiderThemeNodes.oscs.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (_) {}
    });
    this.spiderThemeNodes = { oscs: [], gains: [] };
    this.isThemePlaying = false;
  }

  // Hero Hurt Impact
  public playHeroHurt() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);

    this.playNoise(0.12, 0.25);
  }

  // Game Start Launch Sound
  public playGameStart() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C major fanfare
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const time = now + idx * 0.06;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.28, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(time);
      osc.stop(time + 0.22);
    });
  }

  // Level Complete Fanfare
  public playLevelComplete() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const time = now + idx * 0.08;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(time);
      osc.stop(time + 0.3);
    });
  }

  // White noise generator helper
  private playNoise(duration: number, volume: number) {
    if (!this.ctx) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    noise.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }
}

export const soundFx = new SoundSystem();

