import { TestBed } from '@angular/core/testing';
import { RoutineTask } from '@domain/models/routine-task';
import { TaskCardComponent } from './task-card';

describe('TaskCardComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TaskCardComponent] }));

  function render(status: RoutineTask['status']): HTMLElement {
    const fixture = TestBed.createComponent(TaskCardComponent);
    fixture.componentRef.setInput('task', { id: 't', pictogram: 'bed', status });
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('shows a check once the task is done', () => {
    const element = render('done');

    expect(element.querySelector('.m-task-card--done')).not.toBeNull();
    expect(element.querySelector('.m-task-card__check')).not.toBeNull();
  });

  it('shows an hourglass on the next task', () => {
    expect(render('next').querySelector('.m-task-card__status')).not.toBeNull();
  });

  it('shows no status mark on an upcoming task', () => {
    expect(render('upcoming').querySelector('.m-task-card__status')).toBeNull();
  });

  it('renders no visible text', () => {
    expect(render('done').textContent?.trim()).toBe('');
  });
});
