/**
 * Web Audio API synthesized sound generator for Frank Burger
 * Provides sound feedback without requiring external audio assets.
 */
class SoundEffects {
  private ctx: AudioContext | null = null;
  private isUnlocked = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.unlockAudio();
        window.removeEventListener('click', unlock);
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('keydown', unlock);
      };
      window.addEventListener('click', unlock, { passive: true });
      window.addEventListener('touchstart', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
    }
  }

  public unlockAudio() {
    try {
      this.initCtx();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          this.isUnlocked = true;
        });
      } else if (this.ctx) {
        this.isUnlocked = true;
      }
    } catch {
      // ignore
    }
  }

  private initCtx(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Pleasant notification chime when item added to cart
  playAddToCart() {
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Audio playback silently guarded
    }
  }

  // Rich positive chime for order placed successfully
  playOrderSuccess() {
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + i * 0.09;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.01, start);
        gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.38);
      });
    } catch {
      // Audio playback guarded
    }
  }

  // Kitchen/Admin/Cashier loud distinct alert bell for incoming orders (3-part sequence)
  playNewOrderAlert() {
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Sequence: High Ding-Dong Ding-Dong with rich harmonic bell tones
      const sequence = [
        { freq: 987.77, time: 0.00, dur: 0.25 }, // B5
        { freq: 1318.51, time: 0.12, dur: 0.35 }, // E6
        { freq: 1567.98, time: 0.28, dur: 0.40 }, // G6
        { freq: 1975.53, time: 0.45, dur: 0.60 }, // B6 (Triumphant High Chime)
      ];

      sequence.forEach((item) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + item.time;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(item.freq, start);

        gain.gain.setValueAtTime(0.01, start);
        gain.gain.linearRampToValueAtTime(0.35, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, start + item.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + item.dur + 0.05);
      });

      // Second harmonic layer for realistic restaurant bell timbre
      const subNotes = [
        { freq: 493.88, time: 0.00, dur: 0.25 },
        { freq: 659.25, time: 0.12, dur: 0.35 },
        { freq: 783.99, time: 0.28, dur: 0.40 },
        { freq: 987.77, time: 0.45, dur: 0.60 },
      ];
      subNotes.forEach((item) => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        const start2 = now + item.time;

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(item.freq, start2);

        gain2.gain.setValueAtTime(0.01, start2);
        gain2.gain.linearRampToValueAtTime(0.2, start2 + 0.03);
        gain2.gain.exponentialRampToValueAtTime(0.001, start2 + item.dur);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc2.start(start2);
        osc2.stop(start2 + item.dur + 0.05);
      });
    } catch {
      // Audio playback guarded
    }
  }
}

export const soundManager = new SoundEffects();

