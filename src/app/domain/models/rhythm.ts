export interface Rhythm {
  readonly speed: number;
}

export const POINTS_PER_PIECE = 3;
export const PLINTH_PIECES = 1;
export const DEFAULT_RHYTHM: Rhythm = { speed: 1.5 };
