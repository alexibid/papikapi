import { Component, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ButtonComponent,
  FocusStateDirective,
  FormFieldComponent,
  HandDrawnDirective,
  TactileDirective,
  TextareaComponent,
  VoiceDictationComponent,
} from 'ibid-ui';
import { I18nService } from '@ibid/services';
import { BEHAVIOUR_DOMAIN_CATALOGUE, behaviourDomainOf } from '@domain/data/behaviour-domains';
import { BEHAVIOUR_DOMAINS, BehaviourDomainId } from '@domain/models/behaviour-domain';
import { DomainHit } from '@domain/models/recognition';
import { DOMAIN_PICTOGRAMS } from '@ui/atoms/pictogram/domain-pictograms';
import { PictogramName } from '@ui/atoms/pictogram/paper-icons';
import { PictogramComponent } from '@ui/atoms/pictogram/pictogram';
import {
  EvaluatedVoiceDiaryProposal,
  VoiceDiaryFlowService,
} from '@application/services/voice-diary-flow.service';
import { ClassroomStore } from '@application/services/classroom-store';

export type VoiceDiaryStep = 'input' | 'attribution';

@Component({
  selector: 'papikapi-voice-diary-modal',
  standalone: true,
  imports: [
    ButtonComponent,
    FocusStateDirective,
    FormFieldComponent,
    FormsModule,
    HandDrawnDirective,
    PictogramComponent,
    TactileDirective,
    TextareaComponent,
    VoiceDictationComponent,
  ],
  templateUrl: './voice-diary-modal.html',
  styleUrl: './voice-diary-modal.scss',
})
export class VoiceDiaryModalComponent {
  protected readonly i18n = inject(I18nService);
  private readonly flow = inject(VoiceDiaryFlowService);
  private readonly classroom = inject(ClassroomStore);

  readonly dismissed = output<void>();
  readonly completed = output<void>();

  readonly step = signal<VoiceDiaryStep>('input');
  readonly draftText = signal('');
  readonly isAnalyzing = signal(false);
  readonly errorMessage = signal('');
  readonly proposal = signal<EvaluatedVoiceDiaryProposal | null>(null);

  protected readonly domainPoints = signal<Record<BehaviourDomainId, number>>({
    comportamento: 0,
    tarefas: 0,
    escola: 0,
    conversas: 0,
    familia: 0,
  });

  protected readonly activeChild = computed(() => {
    const active = this.classroom.children().find((c) => c.id === this.classroom.activeChildId());
    return active ?? this.classroom.children()[0];
  });

  protected readonly totalAdjustedPoints = computed(() => {
    const points = this.domainPoints();
    return Object.values(points).reduce((sum, p) => sum + p, 0);
  });

  protected readonly piecesGained = computed(() => {
    return Math.max(1, Math.round(this.totalAdjustedPoints() / 2));
  });

  protected readonly domains = BEHAVIOUR_DOMAIN_CATALOGUE;

  close(): void {
    this.dismissed.emit();
  }

  onVoiceStream(text: string): void {
    if (text) this.draftText.set(text);
  }

  onVoiceAccepted(text: string): void {
    if (text) this.draftText.set(text);
  }

  async analyze(): Promise<void> {
    const text = this.draftText().trim();
    if (!text) return;

    this.isAnalyzing.set(true);
    this.errorMessage.set('');

    try {
      const child = this.activeChild();
      const evaluated = await this.flow.evaluateSpokenDiary(
        text,
        child?.id,
        child?.name
      );

      this.proposal.set(evaluated);

      const pointsMap: Record<BehaviourDomainId, number> = {
        comportamento: 0,
        tarefas: 0,
        escola: 0,
        conversas: 0,
        familia: 0,
      };

      for (const hit of evaluated.hits) {
        pointsMap[hit.domain] = hit.points;
      }

      this.domainPoints.set(pointsMap);
      this.step.set('attribution');
    } catch (err) {
      this.errorMessage.set(
        err instanceof Error ? err.message : 'Não foi possível analisar o diário.'
      );
    } finally {
      this.isAnalyzing.set(false);
    }
  }

  increment(domain: BehaviourDomainId): void {
    const current = this.domainPoints();
    const updated = {
      ...current,
      [domain]: Math.min((current[domain] ?? 0) + 1, 3),
    };
    this.domainPoints.set(updated);
  }

  decrement(domain: BehaviourDomainId): void {
    const current = this.domainPoints();
    const updated = {
      ...current,
      [domain]: Math.max((current[domain] ?? 0) - 1, 0),
    };
    this.domainPoints.set(updated);
  }

  backToInput(): void {
    this.step.set('input');
  }

  async confirm(): Promise<void> {
    const prop = this.proposal();
    if (!prop) return;

    const points = this.domainPoints();
    const hits: DomainHit[] = BEHAVIOUR_DOMAINS.map((domain) => ({
      domain,
      points: points[domain] ?? 0,
    })).filter((h) => h.points > 0);

    await this.flow.confirmDiary(prop, hits);
    this.completed.emit();
    this.close();
  }

  protected pictogramOf(domain: BehaviourDomainId): PictogramName {
    return DOMAIN_PICTOGRAMS[domain] ?? 'sparkle';
  }

  protected labelOf(domain: BehaviourDomainId): string {
    return this.i18n.translate(behaviourDomainOf(domain).labelKey);
  }
}
