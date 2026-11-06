import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject } from '@angular/core';
import { HouseholdStore } from './household-store';

@Injectable({ providedIn: 'root' })
export class DynamicFaviconService {
  private readonly document = inject(DOCUMENT);
  private readonly household = inject(HouseholdStore);

  constructor() {
    effect(() => {
      const iconUrl = this.household.activeIconUrl();
      this.updateHeadIcons(iconUrl);
    });
  }

  updateHeadIcons(iconUrl: string): void {
    if (!this.document || !iconUrl) return;

    const links = this.document.querySelectorAll<HTMLLinkElement>(
      "link[rel*='icon'], link[rel='apple-touch-icon']"
    );

    links.forEach((link) => {
      link.href = iconUrl;
    });
  }
}
