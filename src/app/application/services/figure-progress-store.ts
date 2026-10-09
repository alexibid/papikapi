import { Injectable, signal } from '@angular/core';
import { DEFAULT_FIGURE_ID, SHIPPED_FIGURE_IDS } from '@domain/data/shipped-figures';
import { FigureProgress } from '@domain/models/figure-progress';
import { PLINTH_PIECES } from '@domain/models/rhythm';
import { chooseFigure, mountCurrent, startProgress } from '@domain/services/figure-cycle';

const STORAGE_KEY = 'papikapi.figure-progress';

@Injectable({ providedIn: 'root' })
export class FigureProgressStore {
  private readonly current = signal<FigureProgress>(this.restore());

  readonly progress = this.current.asReadonly();
  readonly catalogue = SHIPPED_FIGURE_IDS;

  markSeen(pieces: number): void {
    if (pieces === this.current().seenPieces) return;
    this.save({ ...this.current(), seenPieces: pieces });
  }

  choose(figureId: string, seenPieces: number): void {
    this.save(chooseFigure(this.current(), figureId, this.catalogue, seenPieces));
  }

  select(figureId: string, options?: { readonly allowCustom?: boolean }): void {
    if (!options?.allowCustom && !this.catalogue.includes(figureId)) return;
    const prev = this.current();
    if (prev.currentId === figureId) return;
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
      return isProgress(stored) ? stored : startProgress(DEFAULT_FIGURE_ID);
    } catch {
      return startProgress(DEFAULT_FIGURE_ID);
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
