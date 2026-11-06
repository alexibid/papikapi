import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HandDrawnDirective } from 'ibid-ui';
import { I18nService } from '@ibid/services';
import { CreationProgressService } from '@application/services/creation-progress.service';
import { FigureProgressStore } from '@application/services/figure-progress-store';
import { CatalogueFigure, localizedName, unnamedFigure } from '@domain/models/catalogue-figure';
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
  private readonly progress = inject(FigureProgressStore);
  private readonly creation = inject(CreationProgressService);

  readonly currentId = input<string>('');
  readonly chosen = output<string>();
  readonly editRequested = output<CatalogueFigure>();
  readonly dismissed = output<void>();

  protected readonly query = signal('');
  private readonly catalogueFigures = signal<ReadonlyMap<string, CatalogueFigure>>(new Map());

  constructor() {
    void this.creation.fetchCatalogue().then((figures) => {
      if (figures.length > 0) {
        this.catalogueFigures.set(new Map(figures.map((figure) => [figure.id, figure])));
        this.progress.registerCustomFigures(figures.map((figure) => figure.id));
      }
    });
  }

  protected readonly items = computed<readonly FigureChoice[]>(() => {
    const rawQuery = this.query().trim().toLowerCase();
    const current = this.currentId();
    const lang = this.i18n.currentLang();
    const allFigures = this.progress.catalogue;

    return allFigures.map((id) => ({
      id,
      name: this.displayNameOf(id, lang),
      isCurrent: id === current,
    })).filter((item) => {
      if (!rawQuery) return true;
      return item.id.toLowerCase().includes(rawQuery) || item.name.toLowerCase().includes(rawQuery);
    });
  });

  private displayNameOf(figureId: string, language: string): string {
    return localizedName(this.figureOf(figureId).displayName, language);
  }

  private figureOf(figureId: string): CatalogueFigure {
    return this.catalogueFigures().get(figureId) ?? unnamedFigure(figureId);
  }

  protected select(figureId: string): void {
    this.chosen.emit(figureId);
  }

  protected edit(figureId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.editRequested.emit(this.figureOf(figureId));
  }

  protected close(): void {
    this.dismissed.emit();
  }
}
