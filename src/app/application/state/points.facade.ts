import { Injectable, InjectionToken, Signal, computed, inject, signal } from '@angular/core';
import { Action, Store } from '@ngrx/store';
import { DEFAULT_FIGURE_PIECES, SHIPPED_FIGURE_IDS, SHIPPED_FIGURE_PIECE_COUNTS } from '@domain/data/shipped-figures';
import { BehaviourDomainId } from '@domain/models/behaviour-domain';
import { FigureProgress } from '@domain/models/figure-progress';
import { DEFAULT_RHYTHM, PLINTH_PIECES } from '@domain/models/rhythm';
import { Shelf } from '@domain/models/trophy';
import { arrangeShelves, figureAllocation } from '@domain/services/figure-cycle';
import { piecesBuilt } from '@domain/services/pieces-built';
import { PointsActions } from './points.actions';
import { pointsReducer } from './points.reducer';
import {
  selectActivePieces,
  selectAllocations,
  selectAsFigureProgress,
  selectCatalogue,
  selectConsolidatedPoints,
  selectConsolidatingDashOffset,
  selectConsolidatingProgress,
  selectCreditPips,
  selectCurrentFigureId,
  selectFigurePipsFilled,
  selectFigurePipsTotal,
  selectHiddenShelfFigureIds,
  selectIsCurrentMounted,
  selectMountedFigureIds,
  selectRawPoints,
  selectSeenPiecesByFigure,
  selectShelfFigureIds,
  selectShelves,
  selectUnassignedCredits,
} from './points.selectors';
import { PointsState, getInitialPointsState } from './points.state';

export interface ChildPointsFacade {
  readonly rawPoints: Signal<number>;
  readonly consolidatedPoints: Signal<number>;
  readonly consolidatingProgress: Signal<number>;
  readonly unassignedCredits: Signal<number>;
  readonly currentFigureId: Signal<string>;
  readonly mountedFigureIds: Signal<readonly string[]>;
  readonly shelfFigureIds: Signal<readonly string[]>;
  readonly hiddenShelfFigureIds: Signal<readonly string[]>;
  readonly allocations: Signal<Readonly<Record<string, number>>>;
  readonly seenPiecesByFigure: Signal<Readonly<Record<string, number>>>;
  readonly catalogue: Signal<readonly string[]>;
  readonly isCurrentMounted: Signal<boolean>;
  readonly activePieces: Signal<number>;
  readonly figurePipsTotal: Signal<number>;
  readonly figurePipsFilled: Signal<number>;
  readonly consolidatingDashOffset: Signal<string>;
  readonly creditPips: Signal<readonly { id: string; filled: boolean }[]>;
  readonly asFigureProgress: Signal<FigureProgress>;
  readonly shelves: Signal<readonly Shelf[]>;

  allocationFor(figureId: string): number;

  syncRawPoints(rawPoints: number): void;
  setUnassignedCredit(amount: number): void;
  allocatePoint(targetFigureId?: string): void;
  reclaimPoint(sourceFigureId?: string): void;
  allocateCreditToCurrent(): void;
  chooseFigure(figureId: string, seenPieces?: number): void;
  selectFigure(
    figureId: string,
    options?: { readonly allowCustom?: boolean; readonly forceReload?: boolean; readonly keepMounted?: boolean }
  ): void;
  removeFigureFromShelf(figureId: string): void;
  addFigurePoints(figureId: string, count?: number): void;
  removeFigurePoints(figureId: string, count?: number): void;
  mountCurrentFigure(totalPoints?: number): void;
  setStagePieceTotal(figureId: string, total: number): void;
  setOverridePieces(pieces: number): void;
  markFigureSeen(figureId: string, pieces: number): void;
  registerCustomFigures(ids: readonly string[]): void;
  addPoints(points: number, domain?: BehaviourDomainId): void;
  reset(): void;
}

@Injectable({ providedIn: 'root' })
export class ChildPointsFacadeImpl implements ChildPointsFacade {
  private readonly store = inject(Store, { optional: true });
  private readonly fallbackState = signal<PointsState>(getInitialPointsState());

  readonly rawPoints = this.store
    ? this.store.selectSignal(selectRawPoints)
    : computed(() => this.fallbackState().rawPoints);

  readonly consolidatedPoints = this.store
    ? this.store.selectSignal(selectConsolidatedPoints)
    : computed(() => this.fallbackState().consolidatedPoints);

  readonly consolidatingProgress = this.store
    ? this.store.selectSignal(selectConsolidatingProgress)
    : computed(() => this.fallbackState().consolidatingProgress);

  readonly unassignedCredits = this.store
    ? this.store.selectSignal(selectUnassignedCredits)
    : computed(() => this.fallbackState().unassignedCredits);

  readonly currentFigureId = this.store
    ? this.store.selectSignal(selectCurrentFigureId)
    : computed(() => this.fallbackState().currentFigureId);

  readonly mountedFigureIds = this.store
    ? this.store.selectSignal(selectMountedFigureIds)
    : computed(() => this.fallbackState().mountedFigureIds);

  readonly shelfFigureIds = this.store
    ? this.store.selectSignal(selectShelfFigureIds)
    : computed(() => this.fallbackState().shelfFigureIds);

  readonly hiddenShelfFigureIds = this.store
    ? this.store.selectSignal(selectHiddenShelfFigureIds)
    : computed(() => this.fallbackState().hiddenShelfFigureIds);

  readonly allocations = this.store
    ? this.store.selectSignal(selectAllocations)
    : computed(() => this.fallbackState().allocations);

  readonly seenPiecesByFigure = this.store
    ? this.store.selectSignal(selectSeenPiecesByFigure)
    : computed(() => this.fallbackState().seenPiecesByFigure);

  readonly catalogue = this.store
    ? this.store.selectSignal(selectCatalogue)
    : computed(() => Array.from(new Set([...SHIPPED_FIGURE_IDS, ...this.fallbackState().customFigures])));

  readonly isCurrentMounted = this.store
    ? this.store.selectSignal(selectIsCurrentMounted)
    : computed(() => this.fallbackState().mountedFigureIds.includes(this.fallbackState().currentFigureId));

  readonly activePieces = this.store
    ? this.store.selectSignal(selectActivePieces)
    : computed(() => {
        const s = this.fallbackState();
        if (s.overridePieces >= 0) return s.overridePieces;
        const curId = s.currentFigureId;
        if (s.mountedFigureIds.includes(curId)) {
          return s.pieceTotalByFigure[curId] ?? SHIPPED_FIGURE_PIECE_COUNTS[curId] ?? DEFAULT_FIGURE_PIECES;
        }
        const allocated = s.allocations[curId] ?? 0;
        return piecesBuilt(allocated, DEFAULT_RHYTHM);
      });

  readonly figurePipsTotal = this.store
    ? this.store.selectSignal(selectFigurePipsTotal)
    : computed(() => {
        const s = this.fallbackState();
        const curId = s.currentFigureId;
        const total = s.pieceTotalByFigure[curId] ?? SHIPPED_FIGURE_PIECE_COUNTS[curId] ?? DEFAULT_FIGURE_PIECES;
        return Math.max(1, total - PLINTH_PIECES);
      });

  readonly figurePipsFilled = this.store
    ? this.store.selectSignal(selectFigurePipsFilled)
    : computed(() => {
        const s = this.fallbackState();
        const curId = s.currentFigureId;
        if (s.mountedFigureIds.includes(curId)) {
          return 4;
        }
        const allocated = s.allocations[curId] ?? 0;
        if (s.overridePieces < 0 && allocated <= 0) return 0;
        const built = this.activePieces();
        const builtFigPieces = Math.max(0, built - PLINTH_PIECES);
        const total = s.pieceTotalByFigure[curId] ?? SHIPPED_FIGURE_PIECE_COUNTS[curId] ?? DEFAULT_FIGURE_PIECES;
        if (built >= total || builtFigPieces >= this.figurePipsTotal()) {
          return 4;
        }
        const ratio = Math.min(1, Math.max(0, builtFigPieces / this.figurePipsTotal()));
        return Math.round(ratio * 4 * 100) / 100;
      });

  readonly consolidatingDashOffset = this.store
    ? this.store.selectSignal(selectConsolidatingDashOffset)
    : computed(() => {
        const circumference = 56.548;
        const ratio = Math.max(0, Math.min(1, this.consolidatingProgress() / 10));
        return `${circumference * (1 - ratio)}px`;
      });

  readonly creditPips = this.store
    ? this.store.selectSignal(selectCreditPips)
    : computed(() =>
        Array.from({ length: this.unassignedCredits() }, (_, index) => ({
          id: `credit-pip-${index}`,
          filled: true,
        }))
      );

  readonly asFigureProgress = this.store
    ? this.store.selectSignal(selectAsFigureProgress)
    : computed(() => {
        const s = this.fallbackState();
        const curId = s.currentFigureId;
        return {
          currentId: curId,
          mountedIds: s.mountedFigureIds,
          baselinePoints: s.rawPoints,
          seenPieces: s.seenPiecesByFigure[curId] ?? PLINTH_PIECES,
          seenPiecesByFigure: s.seenPiecesByFigure,
          unassignedCredit: s.unassignedCredits,
          consolidatingProgress: s.consolidatingProgress,
          allocations: s.allocations,
          shelfIds: s.shelfFigureIds,
          hiddenShelfIds: s.hiddenShelfFigureIds,
        };
      });

  readonly shelves = this.store
    ? this.store.selectSignal(selectShelves)
    : computed(() => {
        const s = this.fallbackState();
        const curId = s.currentFigureId;
        const curTotal = s.pieceTotalByFigure[curId] ?? SHIPPED_FIGURE_PIECE_COUNTS[curId] ?? DEFAULT_FIGURE_PIECES;
        return arrangeShelves(
          this.asFigureProgress(),
          this.catalogue(),
          this.activePieces(),
          curTotal,
          DEFAULT_RHYTHM,
          s.pieceTotalByFigure
        );
      });

  private dispatch(action: Action): void {
    if (this.store) {
      this.store.dispatch(action);
    } else {
      this.fallbackState.update((state) => pointsReducer(state, action));
    }
  }

  allocationFor(figureId: string): number {
    return figureAllocation(this.asFigureProgress(), figureId);
  }

  syncRawPoints(rawPoints: number): void {
    this.dispatch(PointsActions.syncRawPoints({ rawPoints }));
  }

  setUnassignedCredit(amount: number): void {
    this.dispatch(PointsActions.setUnassignedCredit({ amount }));
  }

  allocatePoint(targetFigureId?: string): void {
    this.dispatch(PointsActions.allocatePoint({ targetFigureId }));
  }

  reclaimPoint(sourceFigureId?: string): void {
    this.dispatch(PointsActions.reclaimPoint({ sourceFigureId }));
  }

  allocateCreditToCurrent(): void {
    this.dispatch(PointsActions.allocateCreditToCurrent());
  }

  chooseFigure(figureId: string, seenPieces?: number): void {
    this.dispatch(PointsActions.chooseFigure({ figureId, seenPieces }));
  }

  selectFigure(
    figureId: string,
    options?: { readonly allowCustom?: boolean; readonly forceReload?: boolean; readonly keepMounted?: boolean }
  ): void {
    this.dispatch(PointsActions.selectFigure({ figureId, options }));
  }

  removeFigureFromShelf(figureId: string): void {
    this.dispatch(PointsActions.removeFigureFromShelf({ figureId }));
  }

  addFigurePoints(figureId: string, count = 1): void {
    this.dispatch(PointsActions.addFigurePoints({ figureId, count }));
  }

  removeFigurePoints(figureId: string, count = 1): void {
    this.dispatch(PointsActions.removeFigurePoints({ figureId, count }));
  }

  mountCurrentFigure(totalPoints?: number): void {
    this.dispatch(PointsActions.mountCurrentFigure({ totalPoints }));
  }

  setStagePieceTotal(figureId: string, total: number): void {
    this.dispatch(PointsActions.setStagePieceTotal({ figureId, total }));
  }

  setOverridePieces(pieces: number): void {
    this.dispatch(PointsActions.setOverridePieces({ pieces }));
  }

  markFigureSeen(figureId: string, pieces: number): void {
    this.dispatch(PointsActions.markFigureSeen({ figureId, pieces }));
  }

  registerCustomFigures(ids: readonly string[]): void {
    this.dispatch(PointsActions.registerCustomFigures({ ids }));
  }

  addPoints(points: number, domain: BehaviourDomainId = 'comportamento'): void {
    this.dispatch(PointsActions.addPointsToDiary({ points, domain }));
  }

  reset(): void {
    this.dispatch(PointsActions.reset());
  }
}

export const CHILD_POINTS_FACADE = new InjectionToken<ChildPointsFacade>(
  'CHILD_POINTS_FACADE',
  {
    providedIn: 'root',
    factory: () => inject(ChildPointsFacadeImpl),
  }
);
