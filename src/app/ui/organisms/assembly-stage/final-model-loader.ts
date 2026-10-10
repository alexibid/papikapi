import { InjectionToken, inject } from '@angular/core';
import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { parseFigureUrl, studioFigureUrl } from '@application/config/figures';
import { FigureDriveService } from '@application/services/figure-drive.service';

export type FinalModelLoader = (url: string) => Promise<Group>;

export const FINAL_MODEL_LOADER = new InjectionToken<FinalModelLoader>('FINAL_MODEL_LOADER', {
  providedIn: 'root',
  factory: () => {
    const drive = inject(FigureDriveService);
    const loader = new GLTFLoader();
    const load = async (url: string): Promise<Group> => (await loader.loadAsync(url)).scene;

    return async (url) => {
      try {
        return await load(url);
      } catch (bundledError) {
        const asset = parseFigureUrl(url);
        if (!asset) throw bundledError;
        if (drive.isConfigured()) {
          try {
            return await load(await drive.assetUrl(asset.figureId, asset.file));
          } catch {
            // Drive unavailable, fall back to the local studio
          }
        }
        return load(studioFigureUrl(asset));
      }
    };
  },
});
