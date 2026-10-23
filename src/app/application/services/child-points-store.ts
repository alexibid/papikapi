import { Injectable, inject } from '@angular/core';
import { CHILD_POINTS_FACADE } from '../state/points.facade';

@Injectable({ providedIn: 'root' })
export class ChildPointsStore {
  private readonly facade = inject(CHILD_POINTS_FACADE);

  readonly rawPoints = this.facade.rawPoints;
  readonly consolidatedPoints = this.facade.consolidatedPoints;
  readonly consolidatingProgress = this.facade.consolidatingProgress;
  readonly unassignedCredits = this.facade.unassignedCredits;
  readonly currentFigureId = this.facade.currentFigureId;
  readonly mountedFigureIds = this.facade.mountedFigureIds;
  readonly shelfFigureIds = this.facade.shelfFigureIds;
  readonly hiddenShelfFigureIds = this.facade.hiddenShelfFigureIds;
  readonly allocations = this.facade.allocations;
  readonly seenPiecesByFigure = this.facade.seenPiecesByFigure;
  readonly catalogue = this.facade.catalogue;
  readonly isCurrentMounted = this.facade.isCurrentMounted;
  readonly activePieces = this.facade.activePieces;
  readonly figurePipsTotal = this.facade.figurePipsTotal;
  readonly figurePipsFilled = this.facade.figurePipsFilled;
  readonly consolidatingDashOffset = this.facade.consolidatingDashOffset;
  readonly creditPips = this.facade.creditPips;
  readonly asFigureProgress = this.facade.asFigureProgress;
  readonly shelves = this.facade.shelves;

  allocationFor(figureId: string): number {
    return this.facade.allocationFor(figureId);
  }

  syncRawPoints(rawPoints: number): void {
    this.facade.syncRawPoints(rawPoints);
  }

  setUnassignedCredit(amount: number): void {
    this.facade.setUnassignedCredit(amount);
  }

  allocatePoint(targetFigureId?: string): void {
    this.facade.allocatePoint(targetFigureId);
  }

  reclaimPoint(sourceFigureId?: string): void {
    this.facade.reclaimPoint(sourceFigureId);
  }

  allocateCreditToCurrent(): void {
    this.facade.allocateCreditToCurrent();
  }

  chooseFigure(figureId: string, seenPieces?: number): void {
    this.facade.chooseFigure(figureId, seenPieces);
  }

  selectFigure(
    figureId: string,
    options?: { readonly allowCustom?: boolean; readonly forceReload?: boolean; readonly keepMounted?: boolean }
  ): void {
    this.facade.selectFigure(figureId, options);
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

  mountCurrentFigure(totalPoints?: number): void {
    this.facade.mountCurrentFigure(totalPoints);
  }

  setStagePieceTotal(figureId: string, total: number): void {
    this.facade.setStagePieceTotal(figureId, total);
  }

  setOverridePieces(pieces: number): void {
    this.facade.setOverridePieces(pieces);
  }

  markFigureSeen(figureId: string, pieces: number): void {
    this.facade.markFigureSeen(figureId, pieces);
  }

  registerCustomFigures(ids: readonly string[]): void {
    this.facade.registerCustomFigures(ids);
  }

  reset(): void {
    this.facade.reset();
  }
}
