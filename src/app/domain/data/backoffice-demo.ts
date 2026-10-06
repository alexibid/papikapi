import {
  AgendaEvent,
  ChildProfile,
  DayRoutine,
  SubjectGrade,
  WeekdayId,
} from '@domain/models/backoffice';

export const WEEKDAYS: readonly WeekdayId[] = ['mon', 'tue', 'wed', 'thu', 'fri'];

export const DEMO_CHILD: ChildProfile = { name: 'Tomás', age: 8, schoolYear: '3º ano' };

export const DEMO_ROUTINES: readonly DayRoutine[] = [
  { day: 'mon', backpack: 'Português · Caderno diário' },
  { day: 'tue', backpack: 'Estudo do Meio · Equipamento de Ginástica' },
  { day: 'wed', backpack: 'Matemática · Material de Expressão' },
  { day: 'thu', backpack: 'Português · Inglês' },
  { day: 'fri', backpack: 'Matemática · Leitura' },
];

export const DEMO_AGENDA: readonly AgendaEvent[] = [
  { id: 'meeting', title: 'Reunião de pais', detail: 'Hoje · 17:30 · Sala 14', kind: 'meeting' },
  { id: 'checkup', title: 'Consulta de pediatria', detail: 'Quinta · 10:00', kind: 'health' },
  { id: 'test', title: 'Ficha de avaliação', detail: 'Segunda · 09:00 · Matemática', kind: 'test' },
];

export const DEMO_GRADES: readonly SubjectGrade[] = [
  { id: 'maths', subject: 'Matemática', score: 4.8, letter: 'A' },
  { id: 'portuguese', subject: 'Português', score: 4.2, letter: 'B+' },
  { id: 'environment', subject: 'Estudo do Meio', score: 5, letter: 'A+' },
];
