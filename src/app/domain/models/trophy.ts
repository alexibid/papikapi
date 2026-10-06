export type TrophyState = 'mounted' | 'building' | 'queued';

export interface Trophy {
  readonly id: string;
  readonly figureId: string;
  readonly state: TrophyState;
  readonly piecesBuilt: number;
  readonly piecesTotal: number;
}

export interface Shelf {
  readonly id: string;
  readonly trophies: readonly Trophy[];
}
