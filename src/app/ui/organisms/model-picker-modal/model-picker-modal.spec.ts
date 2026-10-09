import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModelPickerModalComponent } from './model-picker-modal';

describe('ModelPickerModalComponent', () => {
  let fixture: ComponentFixture<ModelPickerModalComponent>;
  let component: ModelPickerModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelPickerModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModelPickerModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders shipped models', () => {
    expect(component['items']().length).toBeGreaterThan(20);
  });

  it('filters models by search query', () => {
    component['query'].set('fox');
    fixture.detectChanges();

    const items = component['items']();
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items.some((item) => item.id === 'fox')).toBe(true);
  });

  it('emits chosen when a model is selected', () => {
    let chosenId = '';
    component.chosen.subscribe((id) => {
      chosenId = id;
    });

    component['select']('cheetah');
    expect(chosenId).toBe('cheetah');
  });

  it('emits dismissed when closed', () => {
    let closed = false;
    component.dismissed.subscribe(() => {
      closed = true;
    });

    component['close']();
    expect(closed).toBe(true);
  });
});
