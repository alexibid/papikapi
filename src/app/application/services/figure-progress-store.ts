import { Injectable, signal } from '@angular/core';
import { DEFAULT_FIGURE_ID, SHIPPED_FIGURE_IDS } from '@domain/data/shipped-figures';
import { FigureProgress } from '@domain/models/figure-progress';
import { PLINTH_PIECES } from '@domain/models/rhythm';
import {
  allocateCreditToCurrent,
  allocatePoint,
  chooseFigure,
  consolidatePoints,
  figureAllocation,
  mountCurrent,
  reclaimPoint,
  removeFigureFromShelf,
  startProgress,
} from '@domain/services/figure-cycle';

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
    const cur = this.current();
    if (pieces === cur.seenPieces && cur.seenPiecesByFigure?.[cur.currentId] === pieces) return;
    this.save({
      ...cur,
      seenPieces: pieces,
      seenPiecesByFigure: {
        ...(cur.seenPiecesByFigure ?? {}),
        [cur.currentId]: pieces,
      },
    });
  }

  allocation(figureId: string): number {
    return figureAllocation(this.current(), figureId);
  }

  unassignedCredits(): number {
    return this.current().unassignedCredit ?? 0;
  }

  consolidatingProgress(): number {
    return this.current().consolidatingProgress ?? 0;
  }

  setUnassignedCredit(amount: number): void {
    this.save({ ...this.current(), unassignedCredit: Math.max(0, amount) });
  }

  allocatePoint(targetFigureId: string): void {
    this.save(allocatePoint(this.current(), targetFigureId));
  }

  reclaimPoint(sourceFigureId: string): void {
    this.save(reclaimPoint(this.current(), sourceFigureId));
  }

  allocateCreditToCurrent(): void {
    this.save(allocateCreditToCurrent(this.current()));
  }

  removeFigureFromShelf(figureId: string): void {
    this.save(removeFigureFromShelf(this.current(), figureId));
  }

  addFigurePoints(figureId: string, count = 1): void {
    const safeCount = Math.max(1, Math.round(count));
    const cur = this.current();
    const allocations = { ...(cur.allocations ?? {}) };
    const curPts = allocations[figureId] ?? this.allocation(figureId);
    allocations[figureId] = curPts + safeCount;
    const hidden = (cur.hiddenShelfIds ?? []).filter((id) => id !== figureId);
    const shelfIds = Array.from(new Set([...(cur.shelfIds ?? [cur.currentId]), figureId]));
    this.save({
      ...cur,
      hiddenShelfIds: hidden,
      shelfIds,
      allocations,
    });
  }

  removeFigurePoints(figureId: string, count = 1): void {
    const safeCount = Math.max(1, Math.round(count));
    const cur = this.current();
    const allocations = { ...(cur.allocations ?? {}) };
    const curPts = allocations[figureId] ?? this.allocation(figureId);
    const nextPts = Math.max(0, curPts - safeCount);
    allocations[figureId] = nextPts;
    const nextMounted = nextPts <= 0
      ? cur.mountedIds.filter((id) => id !== figureId)
      : cur.mountedIds;
    this.save({
      ...cur,
      mountedIds: nextMounted,
      allocations,
    });
  }

  syncTotalPoints(rawPoints: number): void {
    const cur = this.current();
    const { consolidated, consolidating } = consolidatePoints(rawPoints);
    const allocations = { ...(cur.allocations ?? {}) };
    const curPts = allocations[cur.currentId] ?? Math.max(0, cur.baselinePoints);
    const sumAll =
      Object.values(allocations).reduce((acc, p) => acc + Math.max(0, p), 0) +
      (cur.unassignedCredit ?? 0);

    if (consolidated === 0 && sumAll > 0) {
      this.save({
        ...cur,
        allocations: { [cur.currentId]: 0 },
        unassignedCredit: 0,
        consolidatingProgress: consolidating,
      });
      return;
    }

    if (consolidated > sumAll) {
      const diff = consolidated - sumAll;
      allocations[cur.currentId] = curPts + diff;
      this.save({
        ...cur,
        allocations,
        consolidatingProgress: consolidating,
      });
    } else if (consolidated < sumAll) {
      const diff = sumAll - consolidated;
      allocations[cur.currentId] = Math.max(0, curPts - diff);
      this.save({
        ...cur,
        allocations,
        consolidatingProgress: consolidating,
      });
    } else if ((cur.consolidatingProgress ?? 0) !== consolidating) {
      this.save({
        ...cur,
        consolidatingProgress: consolidating,
      });
    }
  }

  choose(figureId: string, seenPieces?: number): void {
    this.save(chooseFigure(this.current(), figureId, this.catalogue, seenPieces));
  }

  select(
    figureId: string,
    options?: { readonly allowCustom?: boolean; readonly forceReload?: boolean; readonly keepMounted?: boolean }
  ): void {
    if (options?.allowCustom) {
      this.registerCustomFigure(figureId);
    }
    if (!this.catalogue.includes(figureId)) return;
    const prev = this.current();
    if (prev.currentId === figureId && !options?.forceReload) return;
    const mountedIds = options?.keepMounted
      ? prev.mountedIds
      : prev.mountedIds.filter((id) => id !== figureId);
    const allocations = { ...(prev.allocations ?? {}) };
    const byFigure = { ...(prev.seenPiecesByFigure ?? {}) };
    const restoredPieces = options?.forceReload
      ? PLINTH_PIECES
      : (byFigure[figureId] ?? PLINTH_PIECES);
    const hidden = (prev.hiddenShelfIds ?? []).filter((id) => id !== figureId);
    const shelfIds = Array.from(new Set([...(prev.shelfIds ?? [prev.currentId]), figureId]));

    this.save({
      ...prev,
      currentId: figureId,
      mountedIds,
      seenPieces: restoredPieces,
      seenPiecesByFigure: {
        ...byFigure,
        [figureId]: restoredPieces,
      },
      allocations: {
        ...allocations,
        [figureId]: allocations[figureId] ?? 0,
      },
      hiddenShelfIds: hidden,
      shelfIds,
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
        const allocations = { ...(stored.allocations ?? {}) };
        if (!(stored.currentId in allocations)) {
          allocations[stored.currentId] = Math.max(0, stored.baselinePoints ?? 0);
        }
        const byFigure = { ...(stored.seenPiecesByFigure ?? {}) };
        if (!(stored.currentId in byFigure)) {
          byFigure[stored.currentId] = stored.seenPieces;
        }
        return {
          ...stored,
          allocations,
          unassignedCredit: stored.unassignedCredit ?? 0,
          consolidatingProgress: stored.consolidatingProgress ?? 0,
          seenPiecesByFigure: byFigure,
          hiddenShelfIds: Array.isArray(stored.hiddenShelfIds) ? stored.hiddenShelfIds : [],
          shelfIds: Array.isArray(stored.shelfIds) ? stored.shelfIds : [stored.currentId],
        };
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
