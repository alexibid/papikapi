import { Injectable, computed, signal } from '@angular/core';
import { WIREFRAME_ROUTINE } from '@domain/data/routine-tasks';
import { RoutineTask } from '@domain/models/routine-task';

@Injectable({ providedIn: 'root' })
export class RoutineProgressStore {
  readonly tasks = signal<readonly RoutineTask[]>(WIREFRAME_ROUTINE);

  readonly total = computed(() => this.tasks().length);

  readonly doneCount = computed(
    () => this.tasks().filter((task) => task.status === 'done').length
  );

  toggleTask(id: string): void {
    this.tasks.update((tasks) =>
      tasks.map((task) => {
        if (task.id !== id) return task;
        const newStatus = task.status === 'done' ? 'next' : 'done';
        return { ...task, status: newStatus };
      })
    );
  }

  completeTask(id: string): void {
    this.tasks.update((tasks) =>
      tasks.map((task) => (task.id === id ? { ...task, status: 'done' as const } : task))
    );
  }

  reset(): void {
    this.tasks.set(WIREFRAME_ROUTINE);
  }
}
