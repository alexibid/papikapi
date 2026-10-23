import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { I18nService } from '@ibid/services';
import {
  ButtonComponent,
  ChipComponent,
  FormFieldComponent,
  FormOrchestratorDirective,
  HandDrawnDirective,
  TextareaComponent,
} from 'ibid-ui';
import { BEHAVIOUR_DOMAIN_CATALOGUE, behaviourDomainOf } from '@domain/data/behaviour-domains';
import { BehaviourDomainId } from '@domain/models/behaviour-domain';
import { DOMAIN_PICTOGRAMS } from '@ui/atoms/pictogram/domain-pictograms';
import { PictogramName } from '@ui/atoms/pictogram/paper-icons';
import { PictogramComponent } from '@ui/atoms/pictogram/pictogram';
import { DomainHit } from '@domain/models/recognition';
import { DiaryStore } from '@application/services/diary-store';

const MANUAL_POINTS = 2;

@Component({
  selector: 'papikapi-diary-page',
  standalone: true,
  imports: [
    ButtonComponent,
    ChipComponent,
    FormFieldComponent,
    FormOrchestratorDirective,
    HandDrawnDirective,
    PictogramComponent,
    TextareaComponent,
  ],
  templateUrl: './diary.page.html',
  styleUrl: './diary.page.scss',
})
export class DiaryPage {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(DiaryStore);
  protected readonly orchestrator = viewChild<FormOrchestratorDirective>('orchestrator');
  protected readonly domains = BEHAVIOUR_DOMAIN_CATALOGUE;
  protected readonly draft = signal('');

  private readonly edited = signal<readonly DomainHit[] | undefined>(undefined);

  protected readonly hits = computed<readonly DomainHit[]>(
    () => this.edited() ?? this.store.proposal()?.hits ?? []
  );

  constructor() {
    void this.store.load();
  }

  protected async save(): Promise<void> {
    const orchestrator = this.orchestrator();
    if (orchestrator && !orchestrator.validateAndNotify()) {
      return;
    }
    const text = this.draft();
    this.draft.set('');
    this.edited.set(undefined);
    orchestrator?.resetAttention();
    await this.store.record(text);
  }

  protected toggle(domain: BehaviourDomainId): void {
    const current = this.hits();
    const without = current.filter((hit) => hit.domain !== domain);
    this.edited.set(
      without.length === current.length ? [...current, { domain, points: MANUAL_POINTS }] : without
    );
  }

  protected chosen(domain: BehaviourDomainId): boolean {
    return this.hits().some((hit) => hit.domain === domain);
  }

  protected async confirm(): Promise<void> {
    await this.store.confirm(this.hits());
    this.edited.set(undefined);
  }

  protected dismiss(): void {
    this.edited.set(undefined);
    this.store.dismissProposal();
  }

  protected labelOf(domain: BehaviourDomainId): string {
    return this.i18n.translate(behaviourDomainOf(domain).labelKey);
  }

  protected summaryOf(hit: DomainHit): string {
    return `${this.labelOf(hit.domain)} +${hit.points}`;
  }

  protected domainsOf(entryId: string): string {
    const found = new Set(this.store.domainsOf(entryId));
    return this.domains
      .filter((domain) => found.has(domain.id))
      .map((domain) => this.labelOf(domain.id))
      .join(' · ');
  }

  protected pictogramOf(domain: BehaviourDomainId): PictogramName {
    return DOMAIN_PICTOGRAMS[domain];
  }
}
