import { TestBed } from '@angular/core/testing';
import { I18N_CONFIG_TOKEN } from '@ibid/services';
import { Trophy } from '@domain/models/trophy';
import { FigureThumbnailService } from '@application/services/figure-thumbnail.service';
import { PAPIKAPI_I18N_CONFIG } from '../../../i18n.config';
import { TrophyComponent } from './trophy';

describe('TrophyComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [TrophyComponent],
      providers: [
        { provide: I18N_CONFIG_TOKEN, useValue: PAPIKAPI_I18N_CONFIG },
        { provide: FigureThumbnailService, useValue: { load: () => new Promise(() => undefined) } },
      ],
    })
  );

  function create(
    state: Trophy['state'],
    piecesBuilt = 3,
    piecesTotal = 4,
    isChosen = false,
    allocatedPoints = 0
  ) {
    const fixture = TestBed.createComponent(TrophyComponent);
    fixture.componentRef.setInput('trophy', {
      id: 't',
      figureId: 'fox',
      state,
      piecesBuilt,
      piecesTotal,
      isChosen,
      allocatedPoints,
    });
    fixture.componentRef.setInput('ariaLabel', 'label');
    fixture.detectChanges();
    return fixture;
  }

  const render = (state: Trophy['state']): HTMLElement => create(state).nativeElement;

  it('shows a check on a trophy already on the shelf and no progress pips', () => {
    const element = render('mounted');

    expect(element.querySelector('.m-trophy__state')).not.toBeNull();
    expect(element.querySelector('papikapi-progress-pips')).toBeNull();
  });

  it('reflects evolution on the figure thumbnail without rendering progress pips', () => {
    const fixture = create('building', 3, 4);
    const element = fixture.nativeElement;

    expect(element.querySelector('papikapi-progress-pips')).toBeNull();
    expect(fixture.componentInstance['progressRatio']()).toBe(0.75);
    expect(element.querySelector('papikapi-figure-thumbnail')).not.toBeNull();
  });

  it('shows the figure it stands for', () => {
    expect(render('mounted').querySelector('papikapi-figure-thumbnail')).not.toBeNull();
  });

  it('can be chosen only while it is waiting its turn', () => {
    expect(render('queued').querySelector('.m-trophy__pick')).not.toBeNull();
    expect(render('mounted').querySelector('.m-trophy__pick')).toBeNull();
    expect(render('building').querySelector('.m-trophy__pick')).toBeNull();
  });

  it('announces which figure was chosen', () => {
    const fixture = create('queued');
    const chosen: string[] = [];
    fixture.componentInstance.chosen.subscribe((figureId) => chosen.push(figureId));

    fixture.nativeElement.querySelector('.m-trophy__pick button').click();

    expect(chosen).toEqual(['fox']);
  });

  it('renders both + and - buttons on building trophies with points', () => {
    const fixture = create('building', 2, 4, false, 2);
    const plusEmitted: string[] = [];
    const minusEmitted: string[] = [];
    fixture.componentInstance.increment.subscribe((id) => plusEmitted.push(id));
    fixture.componentInstance.decrement.subscribe((id) => minusEmitted.push(id));

    const plusBtn = fixture.nativeElement.querySelector('.m-trophy__action-btn--plus');
    const minusBtn = fixture.nativeElement.querySelector('.m-trophy__action-btn--minus');
    expect(plusBtn).not.toBeNull();
    expect(minusBtn).not.toBeNull();

    plusBtn.click();
    minusBtn.click();

    expect(plusEmitted).toEqual(['fox']);
    expect(minusEmitted).toEqual(['fox']);
  });

  it('hides + button when figure is complete/mounted, and hides - button when figure has 0 points', () => {
    // 0 points: + is visible, - is hidden
    const zeroPtsFixture = create('queued', 0, 4, false, 0);
    expect(zeroPtsFixture.nativeElement.querySelector('.m-trophy__action-btn--plus')).not.toBeNull();
    expect(zeroPtsFixture.nativeElement.querySelector('.m-trophy__action-btn--minus')).toBeNull();

    // Mounted / complete: neither + nor - is visible (buttons disappear)
    const mountedFixture = create('mounted', 4, 4, false, 4);
    expect(mountedFixture.nativeElement.querySelector('.m-trophy__action-btn--plus')).toBeNull();
    expect(mountedFixture.nativeElement.querySelector('.m-trophy__action-btn--minus')).toBeNull();
  });

  it('shows remove button on 0-point unchosen trophy and emits remove on click', () => {
    const fixture = create('queued', 0, 4, false, 0);
    const removed: string[] = [];
    fixture.componentInstance.remove.subscribe((id) => removed.push(id));

    const removeBtn = fixture.nativeElement.querySelector('.m-trophy__remove-btn');
    expect(removeBtn).not.toBeNull();

    removeBtn.click();
    expect(removed).toEqual(['fox']);
  });

  it('does not show remove button on chosen trophy or when allocated points > 0 or mounted', () => {
    expect(create('queued', 0, 4, true, 0).nativeElement.querySelector('.m-trophy__remove-btn')).toBeNull();
    expect(create('building', 2, 4, false, 2).nativeElement.querySelector('.m-trophy__remove-btn')).toBeNull();
    expect(create('mounted', 4, 4, false, 0).nativeElement.querySelector('.m-trophy__remove-btn')).toBeNull();
  });

  it('renders no visible text', () => {
    expect(render('mounted').textContent?.trim()).toBe('');
    expect(render('building').textContent?.trim()).toBe('');
    expect(render('queued').textContent?.trim()).toBe('');
  });
});
