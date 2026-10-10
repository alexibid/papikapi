import { Injectable, InjectionToken, inject, signal } from '@angular/core';

export interface FigureDriveConfig {
  readonly indexFileId: string;
  readonly apiKey: string;
}

const RUNTIME_CONFIG_URL = '/app-env.json';
const DEFAULT_INDEX_FILE_ID = '1_K-EHUZV00Z3JaEOmKBo-7rlRMsq2mHh';

@Injectable({ providedIn: 'root' })
export class FigureDriveConfigStore {
  private readonly current = signal<FigureDriveConfig>({
    indexFileId: DEFAULT_INDEX_FILE_ID,
    apiKey: '',
  });

  readonly config = this.current.asReadonly();

  async load(): Promise<void> {
    try {
      const response = await fetch(RUNTIME_CONFIG_URL, { cache: 'no-store' });
      if (!response.ok) return;
      const body: unknown = await response.json();
      this.current.update((known) => mergedWith(known, body));
    } catch {
      // No runtime config: Drive stays off and the app uses the bundled figures
    }
  }
}

export const FIGURE_DRIVE_CONFIG_TOKEN = new InjectionToken<FigureDriveConfig>(
  'FIGURE_DRIVE_CONFIG',
  {
    providedIn: 'root',
    factory: () => {
      const store = inject(FigureDriveConfigStore);
      return {
        get indexFileId() {
          return store.config().indexFileId;
        },
        get apiKey() {
          return store.config().apiKey;
        },
      };
    },
  }
);

function mergedWith(known: FigureDriveConfig, body: unknown): FigureDriveConfig {
  if (typeof body !== 'object' || body === null) return known;
  return {
    indexFileId: textOf(body, 'driveIndexFileId') || known.indexFileId,
    apiKey: textOf(body, 'driveApiKey') || known.apiKey,
  };
}

function textOf(body: object, field: string): string {
  const value = (body as Record<string, unknown>)[field];
  return typeof value === 'string' ? value : '';
}
