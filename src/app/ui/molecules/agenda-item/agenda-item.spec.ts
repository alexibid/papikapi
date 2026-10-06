import { TestBed } from '@angular/core/testing';
import { AgendaItemComponent } from './agenda-item';

describe('AgendaItemComponent', () => {
  it('shows the event and its kind', () => {
    TestBed.configureTestingModule({ imports: [AgendaItemComponent] });
    const fixture = TestBed.createComponent(AgendaItemComponent);
    fixture.componentRef.setInput('event', {
      id: 'e',
      title: 'Reunião',
      detail: 'Hoje',
      kind: 'meeting',
    });
    fixture.componentRef.setInput('kindLabel', 'Alerta');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Reunião');
    expect(text).toContain('Hoje');
    expect(text).toContain('Alerta');
  });

  it('shows the icon that belongs to the kind of event', () => {
    TestBed.configureTestingModule({ imports: [AgendaItemComponent] });
    const fixture = TestBed.createComponent(AgendaItemComponent);
    fixture.componentRef.setInput('event', { id: 'e', title: 'T', detail: 'D', kind: 'health' });
    fixture.componentRef.setInput('kindLabel', 'Saúde');
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.m-agenda-item__icon polygon').length
    ).toBeGreaterThan(0);
  });
});
