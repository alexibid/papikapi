import { InjectionToken } from '@angular/core';
import { ACESFilmicToneMapping, WebGLRenderer } from 'three';

export type RendererFactory = (canvas: HTMLCanvasElement) => WebGLRenderer;

export const RENDERER_FACTORY = new InjectionToken<RendererFactory>('RENDERER_FACTORY', {
  providedIn: 'root',
  factory: () => (canvas) => {
    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    return renderer;
  },
});
