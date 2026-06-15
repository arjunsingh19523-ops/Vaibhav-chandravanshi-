/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Sound effects synthesizer using browser Web Audio API
class ChessSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      // Use standard and legacy prefixed constructors
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    // Resume context if suspended (browser security restriction)
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch((e) => console.warn('Failed to resume AudioContext:', e));
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMuteState(): boolean {
    return this.isMuted;
  }

  // Normal chess piece placement contact sound
  public playMove() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Warm low-pass filter to simulate wood tap resonance
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.Q.setValueAtTime(1, now);

      // Main click oscillator
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      // Fast sweeping pitch downward
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.1);

      // Volume envelope
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      // Connect
      osc.connect(gain);
      gain.connect(filter);
      filter.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {
      console.warn('Web Audio synthesis error:', e);
    }
  }

  // Double wooden contact tap for captures
  public playCapture() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);

      // Tap 1: First strike
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(450, now);
      osc1.frequency.exponentialRampToValueAtTime(220, now + 0.05);

      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc1.connect(gain1);
      gain1.connect(filter);

      // Tap 2: Micro-delayed follow-up
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      const delay = 0.035;

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(320, now + delay);
      osc2.frequency.exponentialRampToValueAtTime(160, now + delay + 0.07);

      gain2.gain.setValueAtTime(0.25, now + delay);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.06);

      osc2.connect(gain2);
      gain2.connect(filter);

      filter.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.06);

      osc2.start(now + delay);
      osc2.stop(now + delay + 0.08);
    } catch (e) {
      console.warn('Web Audio synthesis error:', e);
    }
  }

  // Bright dual-tone dynamic alarm alert chime
  public playCheck() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 0.28;

      // Clean delay/echo emulation with master gain node
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.2, now);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      // Tone A: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);

      // Tone B: 659.25 Hz (E5) - high alert interval friction
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(740, now); // F#5 to make it super bright tech indicator

      osc1.connect(masterGain);
      osc2.connect(masterGain);
      masterGain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + duration);

      osc2.start(now);
      osc2.stop(now + duration);
    } catch (e) {
      console.warn('Web Audio synthesis error:', e);
    }
  }

  // Triumphant or dramatic arpeggio ending
  public playCheckmate() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Note frequency sequences: C4 (261.63), E4 (329.63), G4 (392.00), C5 (523.25)
      const notes = [261.63, 329.63, 392.00, 523.25];
      const noteDelay = 0.08;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * noteDelay;

        // Custom chime harmonics mixing
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        // Sweeps slightly upward for premium feel
        osc.frequency.linearRampToValueAtTime(freq * 1.01, startTime + 0.4);

        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.5);
      });
    } catch (e) {
      console.warn('Web Audio synthesis error:', e);
    }
  }

  // MEME SOUND 1: Husky, low, comedy downward slide sigh ("Bruh!")
  public playBruh() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 0.35;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Sawtooth has plenty of harmonics to filter, mimicking vocal chords
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + duration);

      // Lowpass sweeps downward for vocal 'uh...' formant closure
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(140, now + duration);
      filter.Q.setValueAtTime(4, now); // Add resonance for emphasis

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch (e) {
      console.warn('Web Audio Bruh synthesis error:', e);
    }
  }

  // MEME SOUND 2: High-pitched cartoon cheek-pop and sliding whistle ("Noice!")
  public playNoice() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Part A: Pop action (fast high transient)
      const oscPop = ctx.createOscillator();
      const gainPop = ctx.createGain();
      oscPop.type = 'sine';
      oscPop.frequency.setValueAtTime(1100, now);
      oscPop.frequency.exponentialRampToValueAtTime(280, now + 0.04);
      gainPop.gain.setValueAtTime(0.35, now);
      gainPop.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      oscPop.connect(gainPop);
      gainPop.connect(ctx.destination);
      oscPop.start(now);
      oscPop.stop(now + 0.05);

      // Part B: Slid/Whistle ("-oiiice")
      const delay = 0.035;
      const oscWhistle = ctx.createOscillator();
      const gainWhistle = ctx.createGain();
      oscWhistle.type = 'sine';
      oscWhistle.frequency.setValueAtTime(260, now + delay);
      oscWhistle.frequency.exponentialRampToValueAtTime(650, now + delay + 0.14);

      gainWhistle.gain.setValueAtTime(0.18, now + delay);
      gainWhistle.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);

      oscWhistle.connect(gainWhistle);
      gainWhistle.connect(ctx.destination);
      oscWhistle.start(now + delay);
      oscWhistle.stop(now + delay + 0.16);
    } catch (e) {
      console.warn('Web Audio Noice synthesis error:', e);
    }
  }

  // MEME SOUND 3: Deep dramatic boom paired with a terrible disharmonious bell ring ("EMOTIONAL DAMAGE!")
  public playEmotionalDamage() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. Deep Sub-bass Drop Boom
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(90, now);
      bassOsc.frequency.linearRampToValueAtTime(40, now + 0.4);

      bassGain.gain.setValueAtTime(0.45, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      bassOsc.connect(bassGain);
      bassGain.connect(ctx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + 0.5);

      // 2. High friction disharmony chords for instant shock multiplier
      const freqs = [385, 412, 195]; // weird dissonant intervals
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + 0.02);
        
        // Pitch vibrato shock
        osc.frequency.linearRampToValueAtTime(freq * 0.95, now + 0.45);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, now);

        gain.gain.setValueAtTime(0.18, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + 0.02);
        osc.stop(now + 0.5);
      });
    } catch (e) {
      console.warn('Web Audio Emotional Damage synthesis error:', e);
    }
  }
}

export const soundEffects = new ChessSoundEngine();
