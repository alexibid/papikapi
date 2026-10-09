import { Injectable } from '@angular/core';

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

  async triggerGeneration(payload: {
    readonly name: string;
    readonly prompt: string;
    readonly images: readonly string[];
  }): Promise<boolean> {
    if (typeof fetch !== 'function') {
      return false;
    }

    try {
      const response = await fetch('http://localhost:4502/api/creator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
