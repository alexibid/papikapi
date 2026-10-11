import { Injectable, inject } from '@angular/core';
import {
  FigureAsset,
  isStaticAsset,
  parseFigureUrl,
  studioFigureUrl,
} from '@application/config/figures';
import { AssemblyPlan } from '@domain/assembly/assembly-plan';
import { readAssemblyPlan } from '@domain/assembly/assembly-plan-reader';
import { FigureAssetsService } from './figure-assets.service';

@Injectable({ providedIn: 'root' })
export class AssemblyPlanService {
  private readonly assets = inject(FigureAssetsService);

  async load(url: string): Promise<AssemblyPlan> {
    const response = await this.firstAvailable(url);
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return readAssemblyPlan(await response.json());
  }

  private async firstAvailable(url: string): Promise<Response> {
    const bundled = await fetch(url, { cache: 'no-store' });
    const asset = parseFigureUrl(url);
    if (isStaticAsset(bundled) || !asset) return bundled;
    return (await this.fromAssets(asset)) ?? (await this.fromStudio(asset)) ?? bundled;
  }

  private async fromAssets(asset: FigureAsset): Promise<Response | null> {
    try {
      return await fetch(await this.assets.assetUrl(asset.figureId, asset.file));
    } catch {
      return null;
    }
  }

  private async fromStudio(asset: FigureAsset): Promise<Response | null> {
    try {
      const response = await fetch(studioFigureUrl(asset), { cache: 'no-store' });
      return isStaticAsset(response) ? response : null;
    } catch {
      return null;
    }
  }
}
