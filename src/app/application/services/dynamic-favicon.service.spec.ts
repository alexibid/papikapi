import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { HouseholdStore } from './household-store';
import { DynamicFaviconService } from './dynamic-favicon.service';

describe('DynamicFaviconService', () => {
  let service: DynamicFaviconService;
  let fakeHead: HTMLElement;

  beforeEach(() => {
    fakeHead = document.createElement('head');
    const linkIcon = document.createElement('link');
    linkIcon.rel = 'icon';
    linkIcon.href = 'favicon.ico';
    fakeHead.appendChild(linkIcon);

    const linkApple = document.createElement('link');
    linkApple.rel = 'apple-touch-icon';
    linkApple.href = 'apple-touch-icon.png';
    fakeHead.appendChild(linkApple);

    TestBed.configureTestingModule({
      providers: [
        DynamicFaviconService,
        HouseholdStore,
        {
          provide: DOCUMENT,
          useValue: {
            querySelectorAll: (sel: string) => fakeHead.querySelectorAll(sel),
          },
        },
      ],
    });

    service = TestBed.inject(DynamicFaviconService);
  });

  it('updates all icon links in head when updateHeadIcons is called', () => {
    service.updateHeadIcons('scene/photo.webp');

    const icons = fakeHead.querySelectorAll<HTMLLinkElement>('link');
    icons.forEach((icon) => {
      expect(icon.href).toContain('scene/photo.webp');
    });
  });
});
