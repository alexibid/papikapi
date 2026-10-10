import { Injectable, inject } from '@angular/core';
import { FigureAsset, parseFigureUrl, studioFigureUrl } from '@application/config/figures';
import { AssemblyPlan } from '@domain/assembly/assembly-plan';
import { readAssemblyPlan } from '@domain/assembly/assembly-plan-reader';
import { FigureDriveService } from './figure-drive.service';

@Injectable({ providedIn: 'root' })
export class AssemblyPlanService {
  private readonly drive = inject(FigureDriveService);

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
    if (bundled.ok || !asset) return bundled;
    return (await this.fromDrive(asset)) ?? (await this.fromStudio(asset)) ?? bundled;
  }

  private async fromDrive(asset: FigureAsset): Promise<Response | null> {
    if (!this.drive.isConfigured()) return null;
    try {
      return await fetch(await this.drive.assetUrl(asset.figureId, asset.file));
    } catch {
      return null;
    }
  }

  private async fromStudio(asset: FigureAsset): Promise<Response | null> {
    try {
      const response = await fetch(studioFigureUrl(asset), { cache: 'no-store' });
      return response.ok ? response : null;
    } catch {
      return null;
    }
  }
}
