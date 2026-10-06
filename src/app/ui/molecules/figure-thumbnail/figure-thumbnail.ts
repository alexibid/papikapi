import { Component, effect, inject, input, signal } from '@angular/core';
import { ProjectedFacet } from '@domain/assembly/figure-projection';
import { FigureThumbnailService } from '@application/services/figure-thumbnail.service';
import { PictogramComponent } from '@ui/atoms/pictogram/pictogram';

@Component({
  selector: 'papikapi-figure-thumbnail',
  standalone: true,
  imports: [PictogramComponent],
  templateUrl: './figure-thumbnail.html',
  styleUrl: './figure-thumbnail.scss',
})
export class FigureThumbnailComponent {
  readonly figureId = input.required<string>();

  protected readonly facets = signal<readonly ProjectedFacet[]>([]);

  private readonly thumbnails = inject(FigureThumbnailService);

  constructor() {
    effect(() => {
      const figureId = this.figureId();
      this.facets.set([]);
      this.thumbnails
        .load(figureId)
        .then((facets) => {
          if (figureId === this.figureId()) this.facets.set(facets);
        })
        .catch(() => this.facets.set([]));
    });
  }
}
