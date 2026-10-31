import { Injectable, inject } from '@angular/core';
import { FigureAssetsService } from './figure-assets.service';

export type CreationProgressState = 'running' | 'done' | 'failed';

export interface CreationProgress {
  readonly stepId: string;
  readonly message: string;
  readonly stepIndex: number;
  readonly stepCount: number;
  readonly expectedSeconds: number;
  readonly elapsedInStepMs: number;
  readonly state: CreationProgressState;
}

export type CreationProgressListener = (progress: CreationProgress) => void;

@Injectable({ providedIn: 'root' })
export class CreationProgressService {
  private readonly assets = inject(FigureAssetsService);

  connect(modelName: string, listener: CreationProgressListener): () => void {
    if (typeof EventSource === 'undefined') {
      return () => {};
    }

    const url = `http://localhost:4502/api/creator/progress?name=${encodeURIComponent(modelName)}`;
    const source = new EventSource(url);

    source.onmessage = (event: MessageEvent<string>) => {
      try {
        const data = JSON.parse(event.data);
        if (data && typeof data === 'object') {
          listener(data as CreationProgress);
        }
      } catch {
        // Ignore unparseable SSE frames
      }
    };

    return () => source.close();
  }

  private lastErrorMessage: string | null = null;

  getLastError(): string | null {
    return this.lastErrorMessage;
  }

  async triggerGeneration(payload: {
    readonly name: string;
    readonly prompt: string;
    readonly images: readonly string[];
  }): Promise<boolean> {
    this.lastErrorMessage = null;
    if (typeof fetch !== 'function') {
      return false;
    }

    try {
      const response = await fetch('http://localhost:4502/api/creator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        try {
          const body = (await response.json()) as { error?: string };
          this.lastErrorMessage = body?.error ?? `HTTP ${response.status}: ${response.statusText}`;
        } catch {
          this.lastErrorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
      }
      return response.ok;
    } catch (err) {
      this.lastErrorMessage = (err as Error).message;
      return false;
    }
  }

  async triggerPick(payload: {
    readonly name: string;
    readonly pick: number;
  }): Promise<boolean> {
    this.lastErrorMessage = null;
    if (typeof fetch !== 'function') {
      return false;
    }

    try {
      const response = await fetch('http://localhost:4502/api/creator/pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        try {
          const body = (await response.json()) as { error?: string };
          this.lastErrorMessage = body?.error ?? `HTTP ${response.status}: ${response.statusText}`;
        } catch {
          this.lastErrorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
      }
      return response.ok;
    } catch (err) {
      this.lastErrorMessage = (err as Error).message;
      return false;
    }
  }

  sheetUrl(modelName: string): string {
    return `http://localhost:4502/api/creator/sheet?name=${encodeURIComponent(modelName)}`;
  }

  async checkInfo(modelName: string): Promise<{
    readonly hasAlternatives: boolean;
    readonly sheetUrl: string;
  } | null> {
    if (typeof fetch !== 'function') {
      return null;
    }

    try {
      const response = await fetch(
        `http://localhost:4502/api/creator/info?name=${encodeURIComponent(modelName)}`
      );
      if (!response.ok) return null;
      return (await response.json()) as {
        hasAlternatives: boolean;
        sheetUrl: string;
      };
    } catch {
      return null;
    }
  }

  async fetchCatalogue(): Promise<readonly string[]> {
    if (typeof fetch !== 'function') {
      return [];
    }

    // Try papikapi-api database models endpoint first
    try {
      const response = await fetch('http://localhost:4505/api/v1/models', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          return data.map((item: { id: string }) => item.id).filter(Boolean);
        }
      }
    } catch {
      // Fall back to alternative ports or published assets
    }

    try {
      const response = await fetch('http://localhost:4500/models/index.json', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          return data.map((item: { id: string }) => item.id).filter(Boolean);
        }
      }
    } catch {
      // Fall back to creator server catalogue
    }

    try {
      const response = await fetch('http://localhost:4502/api/catalogue/sync', {
        method: 'POST',
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        if (data?.models && Array.isArray(data.models)) {
          return data.models.map((item: { id: string }) => item.id).filter(Boolean);
        }
      }
    } catch {
      // Fall back to remote CDN
    }

    try {
      const ids = await this.assets.catalogueIds();
      if (ids.length > 0) return ids;
    } catch {
      // Offline fallback
    }

    return [];
  }
}
