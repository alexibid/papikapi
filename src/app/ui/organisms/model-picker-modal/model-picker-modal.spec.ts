import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreationProgressService } from '@application/services/creation-progress.service';
import { creationProgressStub } from '../../../testing/creation-progress.stub';
import { FigureThumbnailService } from '@application/services/figure-thumbnail.service';
import { FigureProgressStore } from '@application/services/figure-progress-store';
import { ModelPickerModalComponent } from './model-picker-modal';

describe('ModelPickerModalComponent', () => {
  let fixture: ComponentFixture<ModelPickerModalComponent>;
  let component: ModelPickerModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelPickerModalComponent],
      providers: [
        { provide: CreationProgressService, useValue: creationProgressStub },
        { provide: FigureThumbnailService, useValue: { load: () => new Promise(() => undefined) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ModelPickerModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders shipped models', () => {
    expect(component['items']().length).toBeGreaterThan(20);
  });

  it('filters models by search query', () => {
    component['query'].set('g92kvjtf');
    fixture.detectChanges();

    const items = component['items']();
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items.some((item) => item.id === 'g92kvjtf')).toBe(true);
  });

  it('emits chosen when a model is selected', () => {
    let chosenId = '';
    component.chosen.subscribe((id) => {
      chosenId = id;
    });

    component['select']('sx8qdo3v');
    expect(chosenId).toBe('sx8qdo3v');
  });

  it('emits dismissed when closed', () => {
    let closed = false;
    component.dismissed.subscribe(() => {
      closed = true;
    });

    component['close']();
    expect(closed).toBe(true);
  });

  it('renders custom models when registered in store', () => {
    const store = TestBed.inject(FigureProgressStore);
    store.registerCustomFigure('d24q07eg');
    fixture.detectChanges();

    const items = component['items']();
    expect(items.some((item) => item.id === 'd24q07eg')).toBe(true);
  });

  it('emits the figure with its display name when edit is triggered', () => {
    let edited = { id: '', displayName: { pt: '', en: '' } };
    component.editRequested.subscribe((figure) => {
      edited = figure;
    });

    const mockEvent = { stopPropagation: vi.fn() } as unknown as MouseEvent;
    component['edit']('d24q07eg', mockEvent);
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(edited).toEqual({ id: 'd24q07eg', displayName: { pt: 'd24q07eg', en: 'd24q07eg' } });
  });
});
