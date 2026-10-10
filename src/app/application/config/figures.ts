const FIGURES_ROOT = '/figures';

export function figureAssemblyUrl(figureId: string): string {
  return `${FIGURES_ROOT}/${figureId}/assembly.json`;
}

export function figureModelUrl(figureId: string): string {
  return `${FIGURES_ROOT}/${figureId}/model.glb`;
}

export function figurePdfUrl(figureId: string): string {
  return `${FIGURES_ROOT}/${figureId}/sheets.pdf`;
}

export interface FigureAsset {
  readonly figureId: string;
  readonly file: string;
}

export function parseFigureUrl(url: string): FigureAsset | null {
  const match = url.match(/^\/figures\/([^/]+)\/([^?]+)/);
  return match ? { figureId: match[1], file: match[2] } : null;
}

export function studioFigureUrl(asset: FigureAsset): string {
  return `http://localhost:4500/models/${asset.figureId}/${asset.file}`;
}
