import { EnvironmentProviders, inject, isDevMode, provideEnvironmentInitializer } from '@angular/core';
import { DiaryStore } from './diary-store';
import { FigureProgressStore } from './figure-progress-store';

export interface PapikapiDevBridge {
  seed(startedAt?: number): Promise<void>;
  reset(): Promise<void>;
  addPoints(amountOrFigureId?: number | string, figureId?: string): void;
  removePoints(amountOrFigureId?: number | string, figureId?: string): void;
  allocatePoint(figureId?: string): void;
  reclaimPoint(figureId?: string): void;
  removeFigure?(figureId?: string): void;
  removeFigureFromShelf?(figureId: string): void;
}

declare global {
  interface Window {
    papikapiDev?: PapikapiDevBridge;
    papikapi?: PapikapiDevBridge;
  }
}

const EMPTIED_KEY = 'papikapi_emptied_on_purpose';

export function providePapikapiDevBridge(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    if (!isDevMode() || typeof window === 'undefined') return;

    const store = inject(DiaryStore);
    const progressStore = inject(FigureProgressStore);

    const bridge: PapikapiDevBridge = {
      seed: async (startedAt?: number) => {
        rememberEmptied(false);
        await store.seed(startedAt);
      },
      reset: async () => {
        rememberEmptied(true);
        await store.reset();
      },
      addPoints: (amountOrFigureId?: number | string, figureId?: string) => {
        const { targetId, count } = parseArgs(
          amountOrFigureId,
          figureId,
          progressStore.progress().currentId
        );
        if (amountOrFigureId === undefined && figureId === undefined && progressStore.unassignedCredits() > 0) {
          progressStore.allocatePoint(targetId);
        } else {
          const unassigned = progressStore.unassignedCredits();
          if (unassigned > 0) {
            const fromCredit = Math.min(unassigned, count);
            for (let i = 0; i < fromCredit; i++) {
              progressStore.allocatePoint(targetId);
            }
            const remainder = count - fromCredit;
            if (remainder > 0) {
              progressStore.addFigurePoints(targetId, remainder);
            }
          } else {
            progressStore.addFigurePoints(targetId, count);
          }
        }
      },
      removePoints: (amountOrFigureId?: number | string, figureId?: string) => {
        const { targetId, count } = parseArgs(
          amountOrFigureId,
          figureId,
          progressStore.progress().currentId
        );
        if (amountOrFigureId === undefined && figureId === undefined) {
          progressStore.reclaimPoint(targetId);
        } else {
          progressStore.removeFigurePoints(targetId, count);
        }
      },
      allocatePoint: (figureId?: string) => {
        progressStore.allocatePoint(figureId ?? progressStore.progress().currentId);
      },
      reclaimPoint: (figureId?: string) => {
        progressStore.reclaimPoint(figureId ?? progressStore.progress().currentId);
      },
      removeFigure: (figureId?: string) => {
        progressStore.removeFigureFromShelf(figureId ?? progressStore.progress().currentId);
      },
      removeFigureFromShelf: (figureId: string) => {
        progressStore.removeFigureFromShelf(figureId);
      },
    };

    window.papikapiDev = bridge;
    window.papikapi = bridge;

    if (!wasEmptiedOnPurpose()) void store.seedIfEmpty();
  });
}

export function parseArgs(
  a?: number | string,
  b?: number | string,
  defaultFigureId = ''
): { readonly targetId: string; readonly count: number } {
  let count = 1;
  let targetId = defaultFigureId;

  if (typeof a === 'number') {
    count = Math.max(1, Math.round(a));
    if (typeof b === 'string' && b.trim()) {
      targetId = b.trim();
    }
  } else if (typeof a === 'string' && a.trim()) {
    targetId = a.trim();
    if (typeof b === 'number') {
      count = Math.max(1, Math.round(b));
    }
  } else if (typeof b === 'number') {
    count = Math.max(1, Math.round(b));
  } else if (typeof b === 'string' && b.trim()) {
    targetId = b.trim();
  }

  return { targetId, count };
}

function wasEmptiedOnPurpose(): boolean {
  try {
    return sessionStorage.getItem(EMPTIED_KEY) === '1';
  } catch {
    return false;
  }
}

function rememberEmptied(emptied: boolean): void {
  try {
    if (emptied) sessionStorage.setItem(EMPTIED_KEY, '1');
    else sessionStorage.removeItem(EMPTIED_KEY);
  } catch {
    return;
  }
}
