export interface FigureProgress {
  readonly currentId: string;
  readonly mountedIds: readonly string[];
  readonly baselinePoints: number;
  readonly seenPieces: number;
}
