import { EnvironmentProviders, inject, isDevMode, provideEnvironmentInitializer } from '@angular/core';
import { DiaryStore } from './diary-store';

export interface PapikapiDevBridge {
  seed(startedAt?: number): Promise<void>;
  reset(): Promise<void>;
}

declare global {
  interface Window {
    papikapiDev?: PapikapiDevBridge;
  }
}

const EMPTIED_KEY = 'papikapi_emptied_on_purpose';

export function providePapikapiDevBridge(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    if (!isDevMode() || typeof window === 'undefined') return;

    const store = inject(DiaryStore);

    window.papikapiDev = {
      seed: async (startedAt?: number) => {
        rememberEmptied(false);
        await store.seed(startedAt);
      },
      reset: async () => {
        rememberEmptied(true);
        await store.reset();
      },
    };

    if (!wasEmptiedOnPurpose()) void store.seedIfEmpty();
  });
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
