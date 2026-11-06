import { FigureDisplayNames } from '@ibid/utils';

export interface FigureReference {
  readonly figureId: string;
  readonly displayName: FigureDisplayNames;
}

export interface FigureCreationRequest extends FigureReference {
  readonly prompt: string;
  readonly images: readonly string[];
}

export interface AlternativesSheet extends FigureReference {
  readonly sheetUrl: string;
}

export interface AlternativePick extends FigureReference {
  readonly pick: number;
}
