import { InjectionToken, inject, isDevMode } from '@angular/core';
import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { parseFigureUrl, studioFigureUrl } from '@application/config/figures';
import { FigureAssetsService } from '@application/services/figure-assets.service';

export type FinalModelLoader = (url: string) => Promise<Group>;

export const FINAL_MODEL_LOADER = new InjectionToken<FinalModelLoader>('FINAL_MODEL_LOADER', {
  providedIn: 'root',
  factory: () => {
    const assets = inject(FigureAssetsService);
    const loader = new GLTFLoader();
    const load = async (url: string): Promise<Group> => (await loader.loadAsync(url)).scene;

    return async (url) => {
      try {
        return await load(url);
      } catch (bundledError) {
        const asset = parseFigureUrl(url);
        if (!asset) throw bundledError;
        try {
          return await load(await assets.assetUrl(asset.figureId, asset.file));
        } catch (assetsError) {
          if (!isDevMode()) throw assetsError;
          return load(studioFigureUrl(asset));
        }
      }
    };
  },
});
