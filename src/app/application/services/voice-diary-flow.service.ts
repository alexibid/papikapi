import { Injectable, inject } from '@angular/core';
import { TranslationService } from '@ibid/services';
import { DomainHit } from '@domain/models/recognition';
import { evaluateBehaviourText } from '@domain/services/behaviour-scoring.engine';
import { RxdbVocabularyRepository } from '@infrastructure/rxdb/rxdb-vocabulary.repository';
import { RxdbDiaryRepository } from '@infrastructure/rxdb/rxdb-diary.repository';
import { RxdbRecognitionRepository } from '@infrastructure/rxdb/rxdb-recognition.repository';
import { RxdbTreeRepository } from '@infrastructure/rxdb/rxdb-tree.repository';
import { BOOTSTRAP_RULES } from '@domain/data/bootstrap-rules';
import { recordDiaryEntry } from '@application/use-cases/record-diary-entry';
import { confirmRecognitions } from '@application/use-cases/confirm-recognitions';
import { DiaryDependencies } from '@application/use-cases/diary-dependencies';
import { FigureProgressStore } from './figure-progress-store';
import { PapikapiSensoryFeedbackAdapter } from '@ui/interaction/papikapi-sensory-feedback.adapter';
import { ClassroomStore } from './classroom-store';

export interface EvaluatedVoiceDiaryProposal {
  readonly id: string;
  readonly childId: string;
  readonly rawTextPt: string;
  readonly translatedTextEn: string;
  readonly hits: readonly DomainHit[];
  readonly totalPoints: number;
  readonly piecesEarned: number;
  readonly feedbackPt: string;
}

@Injectable({ providedIn: 'root' })
export class VoiceDiaryFlowService {
  private readonly translation = inject(TranslationService);
  private readonly vocabularyRepo = inject(RxdbVocabularyRepository);
  private readonly figureProgress = inject(FigureProgressStore);
  private readonly sensory = inject(PapikapiSensoryFeedbackAdapter);
  private readonly classroom = inject(ClassroomStore);

  private readonly deps: DiaryDependencies = {
    diary: inject(RxdbDiaryRepository),
    recognitions: inject(RxdbRecognitionRepository),
    tree: inject(RxdbTreeRepository),
    vocabulary: this.vocabularyRepo,
    rules: BOOTSTRAP_RULES,
    newId: () => crypto.randomUUID(),
  };

  async evaluateSpokenDiary(
    spokenPtText: string,
    childId?: string,
    childName?: string
  ): Promise<EvaluatedVoiceDiaryProposal> {
    const activeKid = this.classroom.children().find((c) => c.id === (childId ?? this.classroom.activeChildId()));
    const kidId = activeKid?.id ?? childId ?? 'default';
    const kidName = childName ?? activeKid?.name ?? 'o Tomás';

    const trimmedPt = spokenPtText.trim();
    if (!trimmedPt) {
      throw new Error('Empty diary text provided.');
    }

    // Silent translation PT -> EN
    const translatedEn = await this.toEnglish(trimmedPt);

    // Fetch child's learned vocabulary deltas
    const learned = await this.vocabularyRepo.byChild(kidId);

    // Evaluate deterministically
    const scoring = evaluateBehaviourText(translatedEn, kidName, learned);

    // 2 points = ~1 origami piece
    const piecesEarned = Math.max(1, Math.round(scoring.totalPoints / 2));

    return {
      id: crypto.randomUUID(),
      childId: kidId,
      rawTextPt: trimmedPt,
      translatedTextEn: translatedEn,
      hits: scoring.hits,
      totalPoints: scoring.totalPoints,
      piecesEarned,
      feedbackPt: scoring.feedbackPt,
    };
  }

  async confirmDiary(
    proposal: EvaluatedVoiceDiaryProposal,
    adjustedHits: readonly DomainHit[]
  ): Promise<void> {
    const entry = await recordDiaryEntry(this.deps, {
      childId: proposal.childId,
      text: proposal.rawTextPt,
      at: Date.now(),
    });

    const activeHits = adjustedHits.filter((h) => h.points > 0);
    const untouched =
      activeHits.length === proposal.hits.length &&
      activeHits.every((h) => proposal.hits.some((p) => p.domain === h.domain && p.points === h.points));

    await confirmRecognitions(this.deps, {
      childId: proposal.childId,
      entryId: entry.entry.id,
      hits: activeHits,
      source: untouched ? 'assistant' : 'parent',
      at: Date.now(),
    });

    // Add points to active figure
    const totalAwarded = activeHits.reduce((sum, h) => sum + h.points, 0);
    if (totalAwarded > 0) {
      const curFigureId = this.figureProgress.catalogue[0] ?? '504i5ivf';
      this.figureProgress.addFigurePoints(curFigureId, totalAwarded);
    }

    // Trigger celebration feedback
    this.sensory.onSuccess();
  }

  private async toEnglish(ptText: string): Promise<string> {
    try {
      const translated = await this.translation.translate(ptText, 'pt', 'en');
      return (translated || ptText).trim();
    } catch {
      return ptText.trim();
    }
  }
}
