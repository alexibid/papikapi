import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModelAlternativesModalComponent } from './model-alternatives-modal';
import { I18nService } from '@ibid/services';

describe('ModelAlternativesModalComponent', () => {
  let fixture: ComponentFixture<ModelAlternativesModalComponent>;
  let component: ModelAlternativesModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelAlternativesModalComponent],
      providers: [I18nService],
    }).compileComponents();

    fixture = TestBed.createComponent(ModelAlternativesModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('modelName', 'cat-darth');
    fixture.detectChanges();
  });

  it('renders with 6 alternatives cells and no pre-selected pick', () => {
    expect(component.selectedPick()).toBeNull();
    expect(component.cells.length).toBe(6);

    const cells = fixture.nativeElement.querySelectorAll('.papikapi-alt-modal__cell');
    expect(cells.length).toBe(6);
  });

  it('changes selected pick when a cell is clicked', () => {
    component['selectCell'](5);
    fixture.detectChanges();

    expect(component.selectedPick()).toBe(5);
  });

  it('does not emit picked if confirm is called without a selection', () => {
    const pickedSpy = vi.fn();
    component.picked.subscribe(pickedSpy);

    component['confirm']();
    expect(pickedSpy).not.toHaveBeenCalled();
  });

  it('emits picked with modelName and pick when confirmed with selection', () => {
    const pickedSpy = vi.fn();
    component.picked.subscribe(pickedSpy);

    component['selectCell'](4);
    component['confirm']();

    expect(pickedSpy).toHaveBeenCalledWith({ name: 'cat-darth', pick: 4 });
  });

  it('emits dismissed when closed', () => {
    const dismissedSpy = vi.fn();
    component.dismissed.subscribe(dismissedSpy);

    component['close']();
    expect(dismissedSpy).toHaveBeenCalled();
  });
});
