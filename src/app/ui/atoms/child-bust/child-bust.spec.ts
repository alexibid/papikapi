import { TestBed } from '@angular/core/testing';
import { ChildProfile } from '@domain/models/child-profile';
import { ChildBustComponent } from './child-bust';

const INES: ChildProfile = {
  id: 'ines',
  name: 'Inês',
  avatarBustUrl: 'scene/ines.webp',
  paperColor: '#F8E4D6',
};

describe('ChildBustComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [ChildBustComponent] }));

  function render(child: ChildProfile): HTMLElement {
    const fixture = TestBed.createComponent(ChildBustComponent);
    fixture.componentRef.setInput('child', child);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('should show the bust image of the child', () => {
    const image = render(INES).querySelector('.a-child-bust__image');

    expect(image?.getAttribute('src')).toBe('scene/ines.webp');
    expect(image?.getAttribute('alt')).toBe('');
  });

  it('should cut the paper behind the bust in the child colour', () => {
    const paper = render(INES).querySelector<HTMLElement>('.a-child-bust');

    expect(paper?.style.getPropertyValue('--papikapi-paper-fill')).toBe('#F8E4D6');
  });

  it('should fall back to the avatar sticker when the child has no bust', () => {
    const element = render({ ...INES, avatarBustUrl: '' });

    expect(element.querySelector('.a-child-bust__image')).toBeNull();
    expect(element.querySelector('papikapi-sticker')).not.toBeNull();
  });
});
