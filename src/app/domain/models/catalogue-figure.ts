import { FigureDisplayNames, FigureLanguage } from '@ibid/utils';

export type FigurePreviewView =
  | 'three-quarter'
  | 'three-quarter-wireframe';

export interface FigurePreview {
  readonly view: FigurePreviewView;
  readonly image: string;
}

export interface CatalogueFigure {
  readonly id: string;
  readonly displayName: FigureDisplayNames;
  readonly model?: string;
  readonly preview?: string;
  readonly image?: string;
  readonly previews?: readonly FigurePreview[];
}

export function catalogueFiguresOf(body: unknown): readonly CatalogueFigure[] {
  const entries: readonly unknown[] = Array.isArray(body) ? body : [];
  return entries.flatMap((entry) => (isCatalogueEntry(entry) ? [toCatalogueFigure(entry)] : []));
}

export function localizedName(names: FigureDisplayNames, language: string): string {
  return names[asFigureLanguage(language)];
}

export function unnamedFigure(id: string): CatalogueFigure {
  return { id, displayName: { pt: id, en: id } };
}

export function figurePreviewImage(
  figure: CatalogueFigure,
  view: FigurePreviewView = 'three-quarter'
): string | null {
  const found = figure.previews?.find((p) => p.view === view);
  return found?.image ?? figure.preview ?? figure.image ?? null;
}

function toCatalogueFigure(entry: CatalogueEntry): CatalogueFigure {
  const base = isDisplayNames(entry.displayName) ? { id: entry.id, displayName: entry.displayName } : unnamedFigure(entry.id);
  const previews = Array.isArray(entry.previews) ? entry.previews.filter(isFigurePreview) : undefined;
  return {
    ...base,
    model: typeof entry.model === 'string' ? entry.model : undefined,
    preview: typeof entry.preview === 'string' ? entry.preview : undefined,
    image: typeof entry.image === 'string' ? entry.image : undefined,
    previews: previews && previews.length > 0 ? previews : undefined,
  };
}

function isFigurePreview(value: unknown): value is FigurePreview {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as { view?: unknown; image?: unknown };
  return typeof p.view === 'string' && typeof p.image === 'string';
}

function asFigureLanguage(language: string): FigureLanguage {
  return language === 'en' ? 'en' : 'pt';
}

interface CatalogueEntry {
  readonly id: string;
  readonly displayName?: unknown;
  readonly model?: unknown;
  readonly preview?: unknown;
  readonly image?: unknown;
  readonly previews?: unknown;
}

function isCatalogueEntry(value: unknown): value is CatalogueEntry {
  return typeof value === 'object' && value !== null && typeof (value as { id?: unknown }).id === 'string';
}

function isDisplayNames(value: unknown): value is FigureDisplayNames {
  if (typeof value !== 'object' || value === null) return false;
  const names = value as { pt?: unknown; en?: unknown };
  return typeof names.pt === 'string' && typeof names.en === 'string';
}
