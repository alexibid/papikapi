import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HandDrawnDirective } from 'ibid-ui';
import { I18nService } from '@ibid/services';
import { SHIPPED_FIGURE_IDS } from '@domain/data/shipped-figures';
import { formatFigureName } from '@domain/data/figure-names';
import { PictogramComponent } from '@ui/atoms/pictogram/pictogram';
import { FigureThumbnailComponent } from '@ui/molecules/figure-thumbnail/figure-thumbnail';

interface FigureChoice {
  readonly id: string;
  readonly name: string;
  readonly isCurrent: boolean;
}

@Component({
  selector: 'papikapi-model-picker-modal',
  standalone: true,
  imports: [
    FigureThumbnailComponent,
    FormsModule,
    HandDrawnDirective,
    PictogramComponent,
  ],
  templateUrl: './model-picker-modal.html',
  styleUrl: './model-picker-modal.scss',
})
export class ModelPickerModalComponent {
  protected readonly i18n = inject(I18nService);

  readonly currentId = input<string>('');
  readonly chosen = output<string>();
  readonly dismissed = output<void>();

  protected readonly query = signal('');

  protected readonly items = computed<readonly FigureChoice[]>(() => {
    const rawQuery = this.query().trim().toLowerCase();
    const current = this.currentId();
    const lang = this.i18n.currentLang();

    return SHIPPED_FIGURE_IDS.map((id) => ({
      id,
      name: formatFigureName(id, lang),
      isCurrent: id === current,
    })).filter((item) => {
      if (!rawQuery) return true;
      return item.id.toLowerCase().includes(rawQuery) || item.name.toLowerCase().includes(rawQuery);
    });
  });

  protected select(figureId: string): void {
    this.chosen.emit(figureId);
  }

  protected close(): void {
    this.dismissed.emit();
  }
}
