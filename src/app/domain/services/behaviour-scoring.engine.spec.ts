import { describe, expect, it } from 'vitest';
import { evaluateBehaviourText } from './behaviour-scoring.engine';

describe('evaluateBehaviourText', () => {
  it('correctly scores positive actions for chores and behavior', () => {
    const text = 'Today he put away the toys and turned off the tv when asked.';
    const result = evaluateBehaviourText(text, 'o Tomás');

    expect(result.hits.some((h) => h.domain === 'tarefas')).toBe(true);
    expect(result.hits.some((h) => h.domain === 'comportamento')).toBe(true);
    expect(result.totalPoints).toBeGreaterThanOrEqual(4);
    expect(result.feedbackPt).toContain('o Tomás');
    expect(result.feedbackPt).toContain('arrumou o quarto e guardou os brinquedos');
  });

  it('ignores negated clauses completely', () => {
    const text = 'He did not brush his teeth and refused to sleep on time.';
    const result = evaluateBehaviourText(text, 'o Tomás');

    expect(result.hits.length).toBe(0);
    expect(result.totalPoints).toBe(0);
  });

  it('recognizes overcoming clauses with contrast conjunctions', () => {
    const text = 'He had a tantrum at first, but then he calmed down and breathed deeply.';
    const result = evaluateBehaviourText(text, 'o Tomás');

    expect(result.hits.some((h) => h.domain === 'comportamento')).toBe(true);
    expect(result.feedbackPt).toContain('recuperou a calma com serenidade');
  });

  it('caps each domain score at 3 points', () => {
    const text = 'He tidied his room, put away all toys, and finished making his bed.';
    const result = evaluateBehaviourText(text, 'o Tomás');

    const choreHit = result.hits.find((h) => h.domain === 'tarefas');
    expect(choreHit).toBeDefined();
    expect(choreHit?.points).toBeLessThanOrEqual(3);
  });
});
