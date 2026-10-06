const FIGURES_ROOT = '/figures';

export function figureAssemblyUrl(figureId: string): string {
  return `${FIGURES_ROOT}/${figureId}/assembly.json`;
}

export function figureModelUrl(figureId: string): string {
  return `${FIGURES_ROOT}/${figureId}/model.glb`;
}
