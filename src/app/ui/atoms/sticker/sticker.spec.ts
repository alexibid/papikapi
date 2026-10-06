import { TestBed } from '@angular/core/testing';
import { StickerComponent } from './sticker';
import { STICKER_NAMES, stickerUrl } from './stickers';

describe('StickerComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [StickerComponent] }));

  function render(name: (typeof STICKER_NAMES)[number]): HTMLElement {
    const fixture = TestBed.createComponent(StickerComponent);
    fixture.componentRef.setInput('name', name);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('shows the cut-out image registered under its name', () => {
    expect(render('avatar').querySelector('img')?.getAttribute('src')).toBe(stickerUrl('avatar'));
  });

  it('is decorative and carries no alternative text', () => {
    expect(render('photo').querySelector('img')?.getAttribute('alt')).toBe('');
  });

  it('names every sticker once', () => {
    expect(new Set(STICKER_NAMES).size).toBe(STICKER_NAMES.length);
  });
});
