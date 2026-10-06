import { Shelf } from '@domain/models/trophy';

export interface MountedCount {
  readonly mounted: number;
  readonly total: number;
}

export function countMounted(shelves: readonly Shelf[]): MountedCount {
  const trophies = shelves.flatMap((shelf) => shelf.trophies);
  return {
    mounted: trophies.filter((trophy) => trophy.state === 'mounted').length,
    total: trophies.length,
  };
}
