import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { ProjectedFacet } from '@domain/assembly/figure-projection';
import { FigureThumbnailService } from '@application/services/figure-thumbnail.service';
import { canonicalFigureId } from '@domain/data/shipped-figures';
import { PictogramComponent } from '@ui/atoms/pictogram/pictogram';

@Component({
  selector: 'papikapi-figure-thumbnail',
  standalone: true,
  imports: [PictogramComponent],
  templateUrl: './figure-thumbnail.html',
  styleUrl: './figure-thumbnail.scss',
})
export class FigureThumbnailComponent {
  private static nextClipId = 0;

  readonly figureId = input.required<string>();
  readonly progress = input<number>(1);
  readonly preferImage = input<boolean>(false);

  protected readonly clipId = `fig-clip-${++FigureThumbnailComponent.nextClipId}`;
  protected readonly facets = signal<readonly ProjectedFacet[]>([]);
  protected readonly imageSrc = signal<string | null>(null);

  protected readonly progressClamped = computed(() => {
    const val = this.progress();
    return Math.max(0, Math.min(1, Number.isFinite(val) ? val : 0));
  });

  protected readonly clipY = computed(() => {
    return Math.round((100 - this.progressClamped() * 100) * 10) / 10;
  });

  protected readonly clipHeight = computed(() => {
    return Math.round(this.progressClamped() * 100 * 10) / 10;
  });

  private readonly thumbnails = inject(FigureThumbnailService);

  constructor() {
    effect(() => {
      const figureId = this.figureId();
      const preferImg = this.preferImage();
      this.facets.set([]);
      if (preferImg) {
        this.imageSrc.set(`/figures/${canonicalFigureId(figureId)}/preview-three-quarter.webp`);
      } else {
        this.imageSrc.set(null);
        this.loadFacets(figureId);
      }
    });
  }

  protected onImageError(): void {
    const figureId = canonicalFigureId(this.figureId());
    const current = this.imageSrc();
    if (current?.endsWith('preview-three-quarter.webp')) {
      this.imageSrc.set(`/figures/${figureId}/art.jpeg`);
    } else {
      this.imageSrc.set(null);
      this.loadFacets(this.figureId());
    }
  }

  private loadFacets(figureId: string): void {
    this.thumbnails
      .load(figureId)
      .then((facets) => {
        if (figureId === this.figureId()) this.facets.set(facets);
      })
      .catch(() => this.facets.set([]));
  }
}
