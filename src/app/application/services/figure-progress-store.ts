import { Injectable, signal } from '@angular/core';
import { DEFAULT_FIGURE_ID, SHIPPED_FIGURE_IDS } from '@domain/data/shipped-figures';
import { FigureProgress } from '@domain/models/figure-progress';
import { PLINTH_PIECES } from '@domain/models/rhythm';
import { chooseFigure, mountCurrent, startProgress } from '@domain/services/figure-cycle';

const STORAGE_KEY = 'papikapi.figure-progress';
const CUSTOM_FIGURES_KEY = 'papikapi.custom-figures';

@Injectable({ providedIn: 'root' })
export class FigureProgressStore {
  private readonly customFigures = signal<readonly string[]>(this.restoreCustomFigures());
  private readonly current = signal<FigureProgress>(this.restore());

  readonly progress = this.current.asReadonly();
  readonly customList = this.customFigures.asReadonly();

  get catalogue(): readonly string[] {
    const custom = this.customFigures();
    const set = new Set([...SHIPPED_FIGURE_IDS, ...custom]);
    return Array.from(set);
  }

  registerCustomFigure(id: string): void {
    const clean = id.trim().toLowerCase();
    if (!clean || SHIPPED_FIGURE_IDS.includes(clean)) return;
    const current = this.customFigures();
    if (!current.includes(clean)) {
      const next = [...current, clean];
      this.customFigures.set(next);
      this.saveCustomFigures(next);
    }
  }

  registerCustomFigures(ids: readonly string[]): void {
    const current = this.customFigures();
    const set = new Set([...current, ...ids.map((id) => id.trim().toLowerCase())]);
    const next = Array.from(set).filter((id) => !SHIPPED_FIGURE_IDS.includes(id) && id.length > 0);
    if (next.length !== current.length || next.some((id, idx) => id !== current[idx])) {
      this.customFigures.set(next);
      this.saveCustomFigures(next);
    }
  }

  markSeen(pieces: number): void {
    if (pieces === this.current().seenPieces) return;
    this.save({ ...this.current(), seenPieces: pieces });
  }

  choose(figureId: string, seenPieces: number): void {
    this.save(chooseFigure(this.current(), figureId, this.catalogue, seenPieces));
  }

  select(
    figureId: string,
    options?: { readonly allowCustom?: boolean; readonly forceReload?: boolean }
  ): void {
    if (options?.allowCustom) {
      this.registerCustomFigure(figureId);
    }
    if (!this.catalogue.includes(figureId)) return;
    const prev = this.current();
    if (prev.currentId === figureId && !options?.forceReload) return;
    const mountedIds = prev.mountedIds.filter((id) => id !== figureId);
    this.save({
      ...prev,
      currentId: figureId,
      mountedIds,
      seenPieces: PLINTH_PIECES,
    });
  }

  mountCurrent(totalPoints: number): void {
    this.save(mountCurrent(this.current(), totalPoints, this.catalogue));
  }

  private save(next: FigureProgress): void {
    this.current.set(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      return;
    }
  }

  private restore(): FigureProgress {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
      if (isProgress(stored)) {
        if (!SHIPPED_FIGURE_IDS.includes(stored.currentId)) {
          this.registerCustomFigure(stored.currentId);
        }
        return stored;
      }
      return startProgress(DEFAULT_FIGURE_ID);
    } catch {
      return startProgress(DEFAULT_FIGURE_ID);
    }
  }

  private restoreCustomFigures(): readonly string[] {
    try {
      const stored = JSON.parse(localStorage.getItem(CUSTOM_FIGURES_KEY) ?? '[]');
      const list = Array.isArray(stored) ? stored.filter((x): x is string => typeof x === 'string') : [];
      return Array.from(new Set(list));
    } catch {
      return [];
    }
  }

  private saveCustomFigures(figures: readonly string[]): void {
    try {
      localStorage.setItem(CUSTOM_FIGURES_KEY, JSON.stringify(figures));
    } catch {
      return;
    }
  }
}

function isProgress(value: unknown): value is FigureProgress {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['currentId'] === 'string' &&
    Array.isArray(candidate['mountedIds']) &&
    candidate['mountedIds'].every((id) => typeof id === 'string') &&
    typeof candidate['baselinePoints'] === 'number' &&
    typeof candidate['seenPieces'] === 'number'
  );
}
