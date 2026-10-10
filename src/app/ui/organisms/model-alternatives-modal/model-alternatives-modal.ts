import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent, HandDrawnDirective } from 'ibid-ui';
import { I18nService } from '@ibid/services';
import { PictogramComponent } from '@ui/atoms/pictogram/pictogram';

export interface AlternativeCell {
  readonly pick: number;
  readonly labelKey: string;
}

@Component({
  selector: 'papikapi-model-alternatives-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent, HandDrawnDirective, PictogramComponent],
  templateUrl: './model-alternatives-modal.html',
  styleUrl: './model-alternatives-modal.scss',
})
export class ModelAlternativesModalComponent {
  protected readonly i18n = inject(I18nService);

  readonly modelName = input.required<string>();
  readonly sheetUrl = input<string>('');

  readonly picked = output<{ readonly name: string; readonly pick: number }>();
  readonly dismissed = output<void>();

  readonly selectedPick = signal<number | null>(null);
  readonly mathFloor = Math.floor;

  readonly cells: readonly AlternativeCell[] = [
    { pick: 1, labelKey: 'pickCell1' },
    { pick: 2, labelKey: 'pickCell2' },
    { pick: 3, labelKey: 'pickCell3' },
    { pick: 4, labelKey: 'pickCell4' },
    { pick: 5, labelKey: 'pickCell5' },
    { pick: 6, labelKey: 'pickCell6' },
  ];

  readonly effectiveSheetUrl = computed(() => {
    const customUrl = this.sheetUrl();
    if (customUrl) return customUrl;
    const name = encodeURIComponent(this.modelName());
    return `http://localhost:4502/api/creator/sheet?name=${name}`;
  });

  readonly confirmLabel = computed(() => {
    const pick = this.selectedPick();
    if (pick === null) {
      return this.i18n.translate('pickAlternativeSelectPrompt');
    }
    const raw = this.i18n.translate('pickAlternativeBtn');
    return raw.replace('{{pick}}', String(pick));
  });

  protected selectCell(pick: number): void {
    this.selectedPick.set(pick);
  }

  protected confirm(): void {
    const pick = this.selectedPick();
    if (pick === null) return;
    this.picked.emit({ name: this.modelName(), pick });
  }

  protected close(): void {
    this.dismissed.emit();
  }
}
