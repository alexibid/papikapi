import { gradeAverage } from './grade-average';

describe('gradeAverage', () => {
  it('rests at zero when there are no grades', () => {
    expect(gradeAverage([])).toBe(0);
  });

  it('averages the scores to one decimal place', () => {
    const grades = [
      { id: 'a', subject: 'A', score: 4.8, letter: 'A' },
      { id: 'b', subject: 'B', score: 4.2, letter: 'B+' },
      { id: 'c', subject: 'C', score: 5, letter: 'A+' },
    ];

    expect(gradeAverage(grades)).toBe(4.7);
  });
});
