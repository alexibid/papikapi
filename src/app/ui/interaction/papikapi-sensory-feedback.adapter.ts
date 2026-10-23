import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { SensoryFeedbackPort, TactileRole } from 'ibid-ui';

interface WebAudioWindow extends Window {
  readonly AudioContext?: typeof AudioContext;
  readonly webkitAudioContext?: typeof AudioContext;
}

@Injectable({ providedIn: 'root' })
export class PapikapiSensoryFeedbackAdapter implements SensoryFeedbackPort {
  private readonly doc = inject(DOCUMENT);
  private readonly soundOnState = signal(true);
  private audioCtx: AudioContext | null = null;

  readonly soundEnabled = this.soundOnState.asReadonly();

  setSoundEnabled(enabled: boolean): void {
    this.soundOnState.set(enabled);
  }

  toggleSound(): void {
    this.soundOnState.update(enabled => !enabled);
  }

  onPress(role: TactileRole): void {
    this.vibrate(8);
    const freq = role === 'keypad' ? 520 : role === 'danger' ? 320 : 440;
    this.playTone(freq, freq * 0.85, 0.032, 'triangle', 0.06);
  }

  onRelease(role: TactileRole): void {
    const freq = role === 'keypad' ? 680 : 580;
    this.playTone(freq * 0.9, freq * 1.18, 0.045, 'sine', 0.05);
  }

  onBlocked(): void {
    this.vibrate([16, 30, 16]);
    this.playTone(210, 150, 0.09, 'sawtooth', 0.05);
  }

  onAttentionRequired(): void {
    this.vibrate([22, 40, 22]);
    this.playTone(260, 180, 0.11, 'triangle', 0.07);
  }

  onSuccess(): void {
    this.vibrate([12, 24, 32]);
    this.playTone(523.25, 783.99, 0.12, 'sine', 0.07);
  }

  private vibrate(pattern: number | number[]): void {
    const nav = this.doc.defaultView?.navigator;
    if (nav && typeof nav.vibrate === 'function') {
      try {
        nav.vibrate(pattern);
      } catch {
        return;
      }
    }
  }

  private playTone(
    startFreq: number,
    endFreq: number,
    durationSec: number,
    oscType: OscillatorType,
    gainPeak: number
  ): void {
    if (!this.soundOnState()) {
      return;
    }
    const ctx = this.resolveAudioContext();
    if (!ctx) {
      return;
    }
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = oscType;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + durationSec);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(gainPeak, now + durationSec * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + durationSec);
    } catch {
      return;
    }
  }

  private resolveAudioContext(): AudioContext | null {
    if (this.audioCtx) {
      return this.audioCtx;
    }
    const view = this.doc.defaultView as WebAudioWindow | null;
    if (!view) {
      return null;
    }
    const Ctor = view.AudioContext ?? view.webkitAudioContext;
    if (typeof Ctor !== 'function') {
      return null;
    }
    try {
      this.audioCtx = new Ctor();
      return this.audioCtx;
    } catch {
      return null;
    }
  }
}
