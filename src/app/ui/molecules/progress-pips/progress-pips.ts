import { Component, computed, input } from '@angular/core';
import { StickerComponent } from '@ui/atoms/sticker/sticker';
import { StickerName } from '@ui/atoms/sticker/stickers';
import { pawFor } from './paw-sequence';

interface Pip {
  readonly filled: boolean;
  readonly paw: StickerName;
}

@Component({
  selector: 'papikapi-progress-pips',
  standalone: true,
  imports: [StickerComponent],
  templateUrl: './progress-pips.html',
  styleUrl: './progress-pips.scss',
})
export class ProgressPipsComponent {
  readonly total = input.required<number>();
  readonly filled = input.required<number>();
  readonly ariaLabel = input('');

  protected readonly pips = computed((): readonly Pip[] =>
    Array.from({ length: this.total() }, (_, position) => ({
      filled: position < this.filled(),
      paw: pawFor(position),
    }))
  );
}
