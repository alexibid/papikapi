import { InjectionToken } from '@angular/core';
import { WebGLRenderer } from 'three';

export type RendererFactory = (canvas: HTMLCanvasElement) => WebGLRenderer;

export const RENDERER_FACTORY = new InjectionToken<RendererFactory>('RENDERER_FACTORY', {
  providedIn: 'root',
  factory: () => (canvas) => new WebGLRenderer({ canvas, antialias: true, alpha: true }),
});
