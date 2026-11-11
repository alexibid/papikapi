import { ComponentFixture, TestBed } from '@angular/core/testing';
import { I18N_CONFIG_TOKEN, TranslationService } from '@ibid/services';
import { PAPIKAPI_I18N_CONFIG } from '../../i18n.config';
import { VoiceDiaryModalComponent } from '../../ui/organisms/voice-diary-modal/voice-diary-modal';
import { VoiceDiaryFlowService } from '../services/voice-diary-flow.service';

describe('User Journey: Voice Diary Recording, Semantic Scoring & Parental Adjustment', () => {
  let fixture: ComponentFixture<VoiceDiaryModalComponent>;
  let component: VoiceDiaryModalComponent;
  let translationService: TranslationService;
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
    translationService = TestBed.inject(TranslationService);
    flowService = TestBed.inject(VoiceDiaryFlowService);
    fixture.detectChanges();
  });

  it('completes the full end-to-end journey: voice capture -> translation -> deterministic evaluation -> parental adjustment -> confirm', async () => {
    // -------------------------------------------------------------
    // Step 1: Initial State - Modal opened in Step 1 (Input)
    // -------------------------------------------------------------
    expect(component.step()).toBe('input');
    expect(component.draftText()).toBe('');

    const dictationEl = fixture.nativeElement.querySelector('ibid-voice-dictation');
    expect(dictationEl).toBeTruthy();

    const analyzeBtn = fixture.nativeElement.querySelector('.papikapi-voice-diary-modal__actions ibid-button button');
    expect(analyzeBtn).toBeTruthy();
    expect(analyzeBtn.getAttribute('aria-disabled')).toBe('true');

    // -------------------------------------------------------------
    // Step 2: Parent speaks in Portuguese via Voice Dictation
    // -------------------------------------------------------------
    const spokenPtText = 'Hoje o Tomás arrumou os brinquedos e tomou banho sem reclamar.';
    component.onVoiceStream(spokenPtText);
    component.onVoiceAccepted(spokenPtText);
    fixture.detectChanges();

    expect(component.draftText()).toBe(spokenPtText);
    expect(analyzeBtn.getAttribute('aria-disabled')).toBeNull();

    // -------------------------------------------------------------
    // Step 3: Parent clicks "Analisar com Papikapi"
    // -------------------------------------------------------------
    // Mock silent translation from PT to EN
    const translatedEnText = 'Today Tomas put away the toys and took a bath without complaining.';
    vi.spyOn(translationService, 'translate').mockResolvedValue(translatedEnText);

    const evaluateSpy = vi.spyOn(flowService, 'evaluateSpokenDiary').mockResolvedValue({
      id: 'prop-123',
      childId: 'c1',
      rawTextPt: spokenPtText,
      translatedTextEn: translatedEnText,
      hits: [
        { domain: 'tarefas', points: 3 },
      ],
      totalPoints: 3,
      piecesEarned: 2,
      feedbackPt: 'Que excelente registo! Hoje destacamos: arrumou o quarto e guardou os brinquedos.',
    });

    await component.analyze();
    fixture.detectChanges();

    expect(evaluateSpy).toHaveBeenCalledWith(spokenPtText, expect.any(String), expect.any(String));
    expect(component.step()).toBe('attribution');
    expect(component.proposal()).toBeTruthy();
    expect(component['domainPoints']().tarefas).toBe(3);

    // -------------------------------------------------------------
    // Step 4: Parent inspects feedback narrative & adjusts points
    // -------------------------------------------------------------
    const feedbackEl = fixture.nativeElement.querySelector('.papikapi-voice-diary-modal__feedback-text');
    expect(feedbackEl.textContent).toContain('arrumou o quarto e guardou os brinquedos');

    // Parent decides to award 1 point for behavior (self-control) as well
    component.increment('comportamento');
    fixture.detectChanges();
    expect(component['domainPoints']().comportamento).toBe(1);

    // Parent decreases chores by 1
    component.decrement('tarefas');
    fixture.detectChanges();
    expect(component['domainPoints']().tarefas).toBe(2);

    expect(component['totalAdjustedPoints']()).toBe(3);

    // -------------------------------------------------------------
    // Step 5: Parent confirms and awards points to the active figure
    // -------------------------------------------------------------
    const confirmSpy = vi.spyOn(flowService, 'confirmDiary').mockResolvedValue();
    const completedSpy = vi.spyOn(component.completed, 'emit');
    const dismissedSpy = vi.spyOn(component.dismissed, 'emit');

    await component.confirm();

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'prop-123' }),
      expect.arrayContaining([
        { domain: 'comportamento', points: 1 },
        { domain: 'tarefas', points: 2 },
      ])
    );
    expect(completedSpy).toHaveBeenCalled();
    expect(dismissedSpy).toHaveBeenCalled();
  });
});
