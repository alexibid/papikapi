import { ComponentFixture, TestBed } from '@angular/core/testing';
import { I18N_CONFIG_TOKEN } from '@ibid/services';
import { PAPIKAPI_I18N_CONFIG } from '@app/i18n.config';
import { VoiceDiaryFlowService } from '@application/services/voice-diary-flow.service';
import { VoiceDiaryModalComponent } from './voice-diary-modal';

describe('VoiceDiaryModalComponent', () => {
  let fixture: ComponentFixture<VoiceDiaryModalComponent>;
  let component: VoiceDiaryModalComponent;
  let flowService: VoiceDiaryFlowService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoiceDiaryModalComponent],
      providers: [
        { provide: I18N_CONFIG_TOKEN, useValue: PAPIKAPI_I18N_CONFIG },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VoiceDiaryModalComponent);
    component = fixture.componentInstance;
    flowService = TestBed.inject(VoiceDiaryFlowService);
    fixture.detectChanges();
  });

  it('initializes in input step with empty text and disabled analyze button', () => {
    expect(component.step()).toBe('input');
    expect(component.draftText()).toBe('');

    const analyzeBtn = fixture.nativeElement.querySelector('.papikapi-voice-diary-modal__actions ibid-button');
    expect(analyzeBtn).toBeTruthy();
  });

  it('updates draftText when speech recognition streams input', () => {
    component.onVoiceStream('arrumou os brinquedos e tomou banho');
    expect(component.draftText()).toBe('arrumou os brinquedos e tomou banho');
  });

  it('transitions to attribution step upon successful analysis', async () => {
    const mockProposal = {
      id: 'prop-1',
      childId: 'c1',
      rawTextPt: 'arrumou os brinquedos',
      translatedTextEn: 'put away toys',
      hits: [{ domain: 'tarefas' as const, points: 2 }],
      totalPoints: 2,
      piecesEarned: 1,
      feedbackPt: 'Excelente dedicação!',
    };

    vi.spyOn(flowService, 'evaluateSpokenDiary').mockResolvedValue(mockProposal);

    component.draftText.set('arrumou os brinquedos');
    await component.analyze();
    fixture.detectChanges();

    expect(component.step()).toBe('attribution');
    expect(component.proposal()).toEqual(mockProposal);
    expect(component['domainPoints']().tarefas).toBe(2);
  });

  it('allows parent to adjust points up and down via steppers', async () => {
    component['domainPoints'].set({
      comportamento: 1,
      tarefas: 2,
      escola: 0,
      conversas: 0,
      familia: 0,
    });
    component.step.set('attribution');
    fixture.detectChanges();

    component.increment('tarefas');
    expect(component['domainPoints']().tarefas).toBe(3);

    // Capped at 3
    component.increment('tarefas');
    expect(component['domainPoints']().tarefas).toBe(3);

    component.decrement('tarefas');
    expect(component['domainPoints']().tarefas).toBe(2);
  });

  it('calls flowService.confirmDiary and emits completed upon confirm', async () => {
    const mockProposal = {
      id: 'prop-1',
      childId: 'c1',
      rawTextPt: 'ajudou a irma',
      translatedTextEn: 'helped sister',
      hits: [{ domain: 'familia' as const, points: 2 }],
      totalPoints: 2,
      piecesEarned: 1,
      feedbackPt: 'Muito bem!',
    };

    component.proposal.set(mockProposal);
    component.step.set('attribution');
    component['domainPoints'].set({
      comportamento: 0,
      tarefas: 0,
      escola: 0,
      conversas: 0,
      familia: 2,
    });

    const confirmSpy = vi.spyOn(flowService, 'confirmDiary').mockResolvedValue();
    const completedSpy = vi.spyOn(component.completed, 'emit');
    const dismissedSpy = vi.spyOn(component.dismissed, 'emit');

    await component.confirm();

    expect(confirmSpy).toHaveBeenCalled();
    expect(completedSpy).toHaveBeenCalled();
    expect(dismissedSpy).toHaveBeenCalled();
  });
});
