import { Injectable, computed, inject } from '@angular/core';
import { restoreFromStorage } from '@application/state/points.state';
import { ChildPointsStore } from './child-points-store';
import { ChildProfilesStore } from './child-profiles-store';

@Injectable({ providedIn: 'root' })
export class ClassroomStore {
  private readonly profiles = inject(ChildProfilesStore);
  private readonly childPoints = inject(ChildPointsStore);

  readonly children = this.profiles.profiles;
  readonly activeChildId = this.profiles.activeChildId;

  private readonly pointsByChild = computed(() => {
    const activeId = this.activeChildId();
    const activePoints = this.childPoints.rawPoints();
    return new Map(
      this.children().map((child) => [
        child.id,
        child.id === activeId ? activePoints : (restoreFromStorage(child.id).rawPoints ?? 0),
      ])
    );
  });

  selectChild(childId: string): void {
    this.profiles.selectChild(childId);
  }

  pointsOf(childId: string): number {
    return this.pointsByChild().get(childId) ?? 0;
  }
}
