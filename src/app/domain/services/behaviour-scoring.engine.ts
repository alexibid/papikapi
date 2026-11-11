import { BehaviourDomainId } from '@domain/models/behaviour-domain';
import { DomainHit } from '@domain/models/recognition';
import { LearnedVocabulary } from '@domain/models/vocabulary';
import {
  CANONICAL_ANCHOR_CATALOGUE,
  CANONICAL_ANCHORS,
  CanonicalAnchorId,
  DOMAIN_CANONICAL_TO_LOCAL,
  NEGATION_WORDS_EN,
  RESOLUTION_CONJUNCTIONS_EN,
} from '@domain/models/behaviour-anchor';

export interface ScoredAnchorHit {
  readonly anchor: CanonicalAnchorId;
  readonly domain: BehaviourDomainId;
  readonly points: number;
  readonly explanationPt: string;
}

export interface BehaviourScoringProposal {
  readonly hits: readonly DomainHit[];
  readonly scoredAnchors: readonly ScoredAnchorHit[];
  readonly totalPoints: number;
  readonly feedbackPt: string;
}

export function evaluateBehaviourText(
  englishText: string,
  childName = 'a criança',
  learned: LearnedVocabulary = { childId: '', words: {}, updatedAt: 0 }
): BehaviourScoringProposal {
  const text = englishText.toLowerCase().trim();
  const clauses = splitClauses(text);
  const anchorHits: ScoredAnchorHit[] = [];
  const domainTotals: Partial<Record<BehaviourDomainId, number>> = {};

  for (const clause of clauses) {
    const isNegated = NEGATION_WORDS_EN.some((neg) => {
      const regex = new RegExp(`\\b${neg}\\b`, 'i');
      return regex.test(clause);
    });

    if (isNegated) continue;

    for (const anchorId of CANONICAL_ANCHORS) {
      const def = CANONICAL_ANCHOR_CATALOGUE[anchorId];
      const match = def.keywords.some((kw) => {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        return regex.test(clause);
      });

      if (match) {
        const localDomain = DOMAIN_CANONICAL_TO_LOCAL[def.domain];
        const learnedDelta = learned.words[anchorId]?.[localDomain] ?? 0;
        const basePoints = def.defaultWeight;
        const totalForAnchor = Math.max(1, Math.min(basePoints + Math.round(learnedDelta / 2), 3));

        anchorHits.push({
          anchor: anchorId,
          domain: localDomain,
          points: totalForAnchor,
          explanationPt: def.explanationPt,
        });

        const currentTotal = domainTotals[localDomain] ?? 0;
        domainTotals[localDomain] = Math.min(Math.max(currentTotal, totalForAnchor), 3);
      }
    }
  }

  // Deduplicate and compile domain hits
  const hits: DomainHit[] = (Object.entries(domainTotals) as [BehaviourDomainId, number][])
    .map(([domain, points]) => ({ domain, points }))
    .sort((a, b) => b.points - a.points);

  const totalPoints = hits.reduce((sum, h) => sum + h.points, 0);
  const feedbackPt = composeEmpatheticFeedback(childName, anchorHits);

  return {
    hits,
    scoredAnchors: anchorHits,
    totalPoints,
    feedbackPt,
  };
}

function splitClauses(text: string): readonly string[] {
  const parts = text.split(/[.,;:!?]+/);
  const splitRegex = new RegExp(`\\s+(?:${RESOLUTION_CONJUNCTIONS_EN.join('|')}|and)\\s+`, 'i');
  const clauses: string[] = [];

  for (const part of parts) {
    const segments = part.split(splitRegex).map((s) => s.trim()).filter(Boolean);
    clauses.push(...segments);
  }

  return clauses.length > 0 ? clauses : [text];
}

function composeEmpatheticFeedback(childName: string, anchors: readonly ScoredAnchorHit[]): string {
  if (anchors.length === 0) {
    return `Hoje o dia com ${childName} foi calmo e sereno. Todos os momentos de presença em família contam!`;
  }

  const uniqueReasons = Array.from(new Set(anchors.map((a) => a.explanationPt)));
  const joinedReasons = uniqueReasons.slice(0, 3).join(', ');

  return `Que excelente registo! Hoje destacamos com muito orgulho: ${joinedReasons}. Um passo fantástico no crescimento de ${childName}!`;
}
