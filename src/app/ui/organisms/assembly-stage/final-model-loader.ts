import { InjectionToken } from '@angular/core';
import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type FinalModelLoader = (url: string) => Promise<Group>;

export const FINAL_MODEL_LOADER = new InjectionToken<FinalModelLoader>('FINAL_MODEL_LOADER', {
  providedIn: 'root',
  factory: () => async (url) => {
    const loader = new GLTFLoader();
    try {
      return (await loader.loadAsync(url)).scene;
    } catch (err) {
      if (url.startsWith('/figures/')) {
        const match = url.match(/^\/figures\/([^/]+)\/(.*)$/);
        if (match) {
          const [, figureId, rest] = match;
          const fallbackUrl = `http://localhost:4500/models/${figureId}/${rest}`;
          return (await loader.loadAsync(fallbackUrl)).scene;
        }
      }
      throw err;
    }
  },
});
