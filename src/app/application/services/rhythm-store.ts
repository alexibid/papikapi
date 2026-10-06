import { Injectable, signal } from '@angular/core';
import { DEFAULT_RHYTHM, Rhythm } from '@domain/models/rhythm';

const STORAGE_KEY = 'papikapi.rhythm';

@Injectable({ providedIn: 'root' })
export class RhythmStore {
  private readonly state = signal<Rhythm>(this.restore());

  readonly rhythm = this.state.asReadonly();

  setSpeed(speed: number): void {
    this.state.update((current) => ({ ...current, speed }));
    this.persist();
  }

  private restore(): Rhythm {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
      return isRhythm(stored) ? { speed: stored.speed } : DEFAULT_RHYTHM;
    } catch {
      return DEFAULT_RHYTHM;
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state()));
    } catch {
      return;
    }
  }
}

function isRhythm(value: unknown): value is Rhythm {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate['speed'] === 'number';
}
