import { SubjectGrade } from '@domain/models/backoffice';

export function gradeAverage(grades: readonly SubjectGrade[]): number {
  if (grades.length === 0) return 0;
  const total = grades.reduce((sum, grade) => sum + grade.score, 0);
  return Math.round((total / grades.length) * 10) / 10;
}
