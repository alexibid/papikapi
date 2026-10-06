export type RoutinePictogram = 'toothbrush' | 'bed' | 'backpack' | 'plate' | 'book' | 'heart';

export type RoutineTaskStatus = 'done' | 'next' | 'upcoming';

export interface RoutineTask {
  readonly id: string;
  readonly pictogram: RoutinePictogram;
  readonly status: RoutineTaskStatus;
}
