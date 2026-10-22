export interface FigureProgress {
  readonly currentId: string;
  readonly mountedIds: readonly string[];
  readonly baselinePoints: number;
  readonly seenPieces: number;
  readonly allocations?: Readonly<Record<string, number>>;
  readonly unassignedCredit?: number;
  readonly consolidatingProgress?: number;
  readonly seenPiecesByFigure?: Readonly<Record<string, number>>;
  readonly hiddenShelfIds?: readonly string[];
  readonly shelfIds?: readonly string[];
}
