import { Injectable, inject } from '@angular/core';
import { ProjectedFacet, projectFigure } from '@domain/assembly/figure-projection';
import { figureAssemblyUrl } from '@application/config/figures';
import { AssemblyPlanService } from './assembly-plan.service';

@Injectable({ providedIn: 'root' })
export class FigureThumbnailService {
  private readonly plans = inject(AssemblyPlanService);
  private readonly cache = new Map<string, Promise<readonly ProjectedFacet[]>>();

  load(figureId: string): Promise<readonly ProjectedFacet[]> {
    const cached = this.cache.get(figureId);
    if (cached) return cached;
    const loading = this.plans
      .load(figureAssemblyUrl(figureId))
      .then(projectFigure)
      .catch((error: unknown) => {
        this.cache.delete(figureId);
        throw error;
      });
    this.cache.set(figureId, loading);
    return loading;
  }
}
