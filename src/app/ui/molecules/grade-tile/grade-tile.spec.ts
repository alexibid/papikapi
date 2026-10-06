import { TestBed } from '@angular/core/testing';
import { GradeTileComponent } from './grade-tile';

describe('GradeTileComponent', () => {
  it('shows the subject with its score and letter', () => {
    TestBed.configureTestingModule({ imports: [GradeTileComponent] });
    const fixture = TestBed.createComponent(GradeTileComponent);
    fixture.componentRef.setInput('grade', {
      id: 'm',
      subject: 'Matemática',
      score: 4.8,
      letter: 'A',
    });
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Matemática');
    expect(text).toContain('4.8 (A)');
  });
});
