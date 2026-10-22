import { Component, computed, inject, input, output } from '@angular/core';
import { HandDrawnDirective, IconButtonComponent } from 'ibid-ui';
import { I18nService } from '@ibid/services';
import { Trophy } from '@domain/models/trophy';
import { PictogramComponent } from '@ui/atoms/pictogram/pictogram';
import { PictogramName } from '@ui/atoms/pictogram/paper-icons';
import { FigureThumbnailComponent } from '@ui/molecules/figure-thumbnail/figure-thumbnail';

const STATE_GLYPH: Readonly<Record<Trophy['state'], PictogramName | null>> = {
  mounted: 'check',
  building: 'hourglass',
  queued: null,
};

@Component({
  selector: 'papikapi-trophy',
  standalone: true,
  imports: [
    FigureThumbnailComponent,
    HandDrawnDirective,
    IconButtonComponent,
    PictogramComponent,
  ],
  templateUrl: './trophy.html',
  styleUrl: './trophy.scss',
})
export class TrophyComponent {
  protected readonly i18n = inject(I18nService);
  readonly trophy = input.required<Trophy>();
  readonly ariaLabel = input('');
  readonly chosen = output<string>();
  readonly increment = output<string>();
  readonly decrement = output<string>();
  readonly remove = output<string>();

  protected readonly isChosen = computed(() => this.trophy().isChosen ?? false);
  protected readonly stateGlyph = computed(() => STATE_GLYPH[this.trophy().state]);
  protected readonly queued = computed(() => this.trophy().state === 'queued');
  protected readonly building = computed(() => this.trophy().state === 'building');

  protected readonly progressRatio = computed(() => {
    const t = this.trophy();
    if (t.state === 'mounted') return 1;
    if (t.state === 'queued') return 0;
    return t.piecesTotal > 0 ? t.piecesBuilt / t.piecesTotal : 0;
  });

  protected readonly isComplete = computed(
    () =>
      this.trophy().state === 'mounted' ||
      this.progressRatio() >= 1 ||
      (this.trophy().piecesTotal > 0 && this.trophy().piecesBuilt >= this.trophy().piecesTotal)
  );

  protected readonly allocated = computed(() => {
    const pts = this.trophy().allocatedPoints;
    if (pts !== undefined) return pts;
    if (this.trophy().state === 'mounted') return 1;
    return this.trophy().piecesBuilt > 1 ? this.trophy().piecesBuilt : 0;
  });

  protected readonly canIncrement = computed(() => !this.isComplete());
  protected readonly canDecrement = computed(() => !this.isComplete() && this.allocated() > 0);

  protected readonly canRemove = computed(() =>
    !this.isChosen() && this.trophy().state !== 'mounted' && this.allocated() === 0
  );

  protected onCardClicked(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest?.('.m-trophy__actions')) return;
    this.chosen.emit(this.trophy().figureId);
  }

  protected onPickClicked(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.chosen.emit(this.trophy().figureId);
  }

  protected onPlus(event: MouseEvent): void {
    event.stopPropagation();
    this.increment.emit(this.trophy().figureId);
  }

  protected onMinus(event: MouseEvent): void {
    event.stopPropagation();
    this.decrement.emit(this.trophy().figureId);
  }

  protected onRemove(event: MouseEvent): void {
    event.stopPropagation();
    this.remove.emit(this.trophy().figureId);
  }
}
