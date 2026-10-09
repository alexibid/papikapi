import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ParentGateModalComponent } from './parent-gate-modal';

describe('ParentGateModalComponent', () => {
  let fixture: ComponentFixture<ParentGateModalComponent>;
  let component: ParentGateModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParentGateModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ParentGateModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('emits unlocked once 4 digits have been entered', () => {
    let unlocked = false;
    component.unlocked.subscribe(() => {
      unlocked = true;
    });

    component['press']('1');
    component['press']('2');
    component['press']('3');
    expect(unlocked).toBe(false);

    component['press']('4');
    expect(unlocked).toBe(true);
  });

  it('allows erasing digits before reaching four', () => {
    component['press']('1');
    component['press']('2');
    expect(component['pin']()).toBe('12');

    component['erase']();
    expect(component['pin']()).toBe('1');
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
