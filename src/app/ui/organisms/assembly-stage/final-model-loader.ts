import { InjectionToken } from '@angular/core';
import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type FinalModelLoader = (url: string) => Promise<Group>;

export const FINAL_MODEL_LOADER = new InjectionToken<FinalModelLoader>('FINAL_MODEL_LOADER', {
  providedIn: 'root',
  factory: () => async (url) => (await new GLTFLoader().loadAsync(url)).scene,
});
