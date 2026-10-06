import { RoutineTask } from '@domain/models/routine-task';

export const WIREFRAME_ROUTINE: readonly RoutineTask[] = [
  { id: 'teeth', pictogram: 'toothbrush', status: 'done' },
  { id: 'bed', pictogram: 'bed', status: 'done' },
  { id: 'backpack', pictogram: 'backpack', status: 'next' },
  { id: 'plate', pictogram: 'plate', status: 'upcoming' },
];
