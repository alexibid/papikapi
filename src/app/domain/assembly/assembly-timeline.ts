import { AssemblyPiece } from './assembly-plan';

export interface PieceMotion {
  readonly fold: number;
  readonly travel: number;
  readonly waiting: boolean;
  readonly arrived: boolean;
}

const FOLD_SHARE = 0.4;
const TRAVEL_SHARE = 0.3;
const DEPTH_WINDOW = 0.5;
const FOCUS_IN_END = 0.18;
const FOCUS_OUT_START = FOLD_SHARE;
const FOCUS_OUT_END = 0.75;

export function pieceMotion(
  piece: Pick<AssemblyPiece, 'progressStart' | 'progressEnd'>,
  progress: number,
): PieceMotion {
  const span = piece.progressEnd - piece.progressStart;
  const local = clamp((progress - piece.progressStart) / span);
  return {
    fold: smooth(clamp(local / FOLD_SHARE)),
    travel: smooth(clamp((local - FOLD_SHARE) / TRAVEL_SHARE)),
    waiting: local === 0,
    arrived: local >= FOLD_SHARE + TRAVEL_SHARE,
  };
}

export function focusWeight(build: number): number {
  const progress = clamp(build);
  if (progress < FOCUS_OUT_START) {
    return smooth(clamp(progress / FOCUS_IN_END));
  }
  return 1 - smooth(clamp((progress - FOCUS_OUT_START) / (FOCUS_OUT_END - FOCUS_OUT_START)));
}

export function faceFold(fold: number, depth: number, maxDepth: number): number {
  if (depth === 0) {
    return 0;
  }
  const startsAt = ((depth - 1) / maxDepth) * DEPTH_WINDOW;
  return smooth(clamp((fold - startsAt) / (1 - DEPTH_WINDOW)));
}

function smooth(value: number): number {
  return value * value * (3 - 2 * value);
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}
