export type WeekdayId = 'mon' | 'tue' | 'wed' | 'thu' | 'fri';

export type AgendaEventKind = 'meeting' | 'health' | 'test';

export interface ChildProfile {
  readonly name: string;
  readonly age: number;
  readonly schoolYear: string;
}

export interface AgendaEvent {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly kind: AgendaEventKind;
}

export interface SubjectGrade {
  readonly id: string;
  readonly subject: string;
  readonly score: number;
  readonly letter: string;
}

export interface DayRoutine {
  readonly day: WeekdayId;
  readonly backpack: string;
}
