import { RoutineTask } from '@domain/models/routine-task';

export const WIREFRAME_ROUTINE: readonly RoutineTask[] = [
  { id: 'teeth', pictogram: 'toothbrush', status: 'next' },
  { id: 'bed', pictogram: 'bed', status: 'upcoming' },
  { id: 'backpack', pictogram: 'backpack', status: 'upcoming' },
  { id: 'plate', pictogram: 'plate', status: 'upcoming' },
];
