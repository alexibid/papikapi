import { Injectable } from '@angular/core';
import { AssemblyPlan } from '@domain/assembly/assembly-plan';
import { readAssemblyPlan } from '@domain/assembly/assembly-plan-reader';

@Injectable({ providedIn: 'root' })
export class AssemblyPlanService {
  async load(url: string): Promise<AssemblyPlan> {
    let response = await fetch(url, { cache: 'no-store' });
    if (!response.ok && url.startsWith('/figures/')) {
      const match = url.match(/^\/figures\/([^/]+)\/(.*)$/);
      if (match) {
        const [, figureId, rest] = match;
        const fallbackUrl = `http://localhost:4500/models/${figureId}/${rest}`;
        try {
          const fallbackRes = await fetch(fallbackUrl, { cache: 'no-store' });
          if (fallbackRes.ok) {
            response = fallbackRes;
          }
        } catch {
          // Fallback fetch failed, retain original response
        }
      }
    }
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return readAssemblyPlan(await response.json());
  }
}
