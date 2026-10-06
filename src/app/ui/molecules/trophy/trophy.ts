import { Component, computed, input, output } from '@angular/core';
import { HandDrawnDirective, IconButtonComponent } from 'ibid-ui';
import { Trophy } from '@domain/models/trophy';
import { PictogramComponent } from '@ui/atoms/pictogram/pictogram';
import { PictogramName } from '@ui/atoms/pictogram/paper-icons';
import { FigureThumbnailComponent } from '@ui/molecules/figure-thumbnail/figure-thumbnail';
import { ProgressPipsComponent } from '@ui/molecules/progress-pips/progress-pips';

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
    ProgressPipsComponent,
  ],
  templateUrl: './trophy.html',
  styleUrl: './trophy.scss',
})
export class TrophyComponent {
  readonly trophy = input.required<Trophy>();
  readonly ariaLabel = input('');
  readonly chosen = output<string>();

  protected readonly stateGlyph = computed(() => STATE_GLYPH[this.trophy().state]);
  protected readonly queued = computed(() => this.trophy().state === 'queued');
  protected readonly building = computed(() => this.trophy().state === 'building');
}
