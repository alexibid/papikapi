import { TestBed } from '@angular/core/testing';
import { Trophy } from '@domain/models/trophy';
import { FigureThumbnailService } from '@application/services/figure-thumbnail.service';
import { TrophyComponent } from './trophy';

describe('TrophyComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [TrophyComponent],
      providers: [
        { provide: FigureThumbnailService, useValue: { load: () => new Promise(() => undefined) } },
      ],
    })
  );

  function create(state: Trophy['state']) {
    const fixture = TestBed.createComponent(TrophyComponent);
    fixture.componentRef.setInput('trophy', {
      id: 't',
      figureId: 'fox',
      state,
      piecesBuilt: 3,
      piecesTotal: 4,
    });
    fixture.componentRef.setInput('ariaLabel', 'label');
    fixture.detectChanges();
    return fixture;
  }

  const render = (state: Trophy['state']): HTMLElement => create(state).nativeElement;

  it('shows a check on a trophy already on the shelf', () => {
    const element = render('mounted');

    expect(element.querySelector('.m-trophy__state')).not.toBeNull();
    expect(element.querySelector('papikapi-progress-pips')).toBeNull();
  });

  it('shows the pieces built so far on a trophy still being assembled', () => {
    expect(render('building').querySelectorAll('.m-progress-pips__pip--filled')).toHaveLength(3);
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

  it('renders no visible text', () => {
    expect(render('mounted').textContent?.trim()).toBe('');
  });
});
