import { Injectable, inject } from '@angular/core';
import { CHILD_POINTS_FACADE } from '@application/state/points.facade';

@Injectable({ providedIn: 'root' })
export class FigureProgressStore {
  private readonly facade = inject(CHILD_POINTS_FACADE);

  readonly progress = this.facade.asFigureProgress;

  get catalogue(): readonly string[] {
    return this.facade.catalogue();
  }

  registerCustomFigure(id: string): void {
    this.facade.registerCustomFigures([id]);
  }

  registerCustomFigures(ids: readonly string[]): void {
    this.facade.registerCustomFigures(ids);
  }

  markSeen(pieces: number): void {
    const cur = this.facade.seenPiecesByFigure()[this.facade.currentFigureId()];
    if (cur === pieces) return;
    this.facade.markFigureSeen(this.facade.currentFigureId(), pieces);
  }

  allocation(figureId: string): number {
    return this.facade.allocationFor(figureId);
  }

  unassignedCredits(): number {
    return this.facade.unassignedCredits();
  }

  consolidatingProgress(): number {
    return this.facade.consolidatingProgress();
  }

  setUnassignedCredit(amount: number): void {
    this.facade.setUnassignedCredit(amount);
  }

  allocatePoint(targetFigureId: string): void {
    this.facade.allocatePoint(targetFigureId);
  }

  reclaimPoint(sourceFigureId: string): void {
    this.facade.reclaimPoint(sourceFigureId);
  }

  allocateCreditToCurrent(): void {
    this.facade.allocateCreditToCurrent();
  }

  removeFigureFromShelf(figureId: string): void {
    this.facade.removeFigureFromShelf(figureId);
  }

  addFigurePoints(figureId: string, count = 1): void {
    this.facade.addFigurePoints(figureId, count);
  }

  removeFigurePoints(figureId: string, count = 1): void {
    this.facade.removeFigurePoints(figureId, count);
  }

  syncTotalPoints(rawPoints: number): void {
    this.facade.syncRawPoints(rawPoints);
  }

  choose(figureId: string, seenPieces?: number): void {
    this.facade.chooseFigure(figureId, seenPieces);
  }

  select(
    figureId: string,
    options?: { readonly allowCustom?: boolean; readonly forceReload?: boolean; readonly keepMounted?: boolean }
  ): void {
    this.facade.selectFigure(figureId, options);
  }

  mountCurrent(totalPoints: number): void {
    this.facade.mountCurrentFigure(totalPoints);
  }
}
