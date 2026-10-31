import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { I18N_CONFIG_TOKEN } from '@ibid/services';
import { PAPIKAPI_I18N_CONFIG } from '../../i18n.config';
import { BackofficePage } from './backoffice.page';

describe('BackofficePage', () => {
  let fixture: ComponentFixture<BackofficePage>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackofficePage],
      providers: [
        provideRouter([]),
        { provide: I18N_CONFIG_TOKEN, useValue: PAPIKAPI_I18N_CONFIG },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(BackofficePage);
    fixture.detectChanges();
  });

  it('renders top bar matching child area with avatar, progress, and back button', () => {
    const el = fixture.nativeElement as HTMLElement;
    const bar = el.querySelector('.papikapi-backoffice__bar');
    expect(bar).not.toBeNull();

    const avatar = el.querySelector('.papikapi-backoffice__avatar');
    expect(avatar).not.toBeNull();

    const progress = el.querySelector('.papikapi-backoffice__progress');
    expect(progress).not.toBeNull();

    const backBtn = el.querySelector('.papikapi-backoffice__back');
    expect(backBtn).not.toBeNull();
  });

  it('should list every classroom child with bust, name and points, plus a new child button', () => {
    const el = fixture.nativeElement as HTMLElement;
    const kids = Array.from(el.querySelectorAll('.papikapi-backoffice__kid'));

    expect(kids.length).toBeGreaterThan(0);
    kids.forEach((kid) => {
      expect(kid.querySelector('papikapi-child-bust')).not.toBeNull();
      expect(kid.querySelector('.papikapi-backoffice__kid-name')?.textContent?.trim()).not.toBe('');
      expect(kid.querySelector('.papikapi-backoffice__kid-points')?.textContent).toMatch(/\d+ pontos/);
    });
    expect(el.querySelector('.papikapi-backoffice__new-kid')?.textContent).toContain('+ Nova Criança');
  });

  it('navigates back to home screen when back button is clicked', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    const backBtn = fixture.nativeElement.querySelector(
      '.papikapi-backoffice__back button'
    ) as HTMLButtonElement;

    backBtn.click();
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });
});
