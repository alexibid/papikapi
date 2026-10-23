import { TestBed } from '@angular/core/testing';
import { IBID_TACTILE_MOTION_CONFIG } from 'ibid-ui';
import {
  PAPIKAPI_TACTILE_MOTION_CONFIG,
  PapikapiPlayfulAnimationStrategy,
} from './papikapi-playful-animation.strategy';
import { PapikapiSensoryFeedbackAdapter } from './papikapi-sensory-feedback.adapter';

describe('Papikapi Playful Interaction Strategy & Sensory Adapter', () => {
  let strategy: PapikapiPlayfulAnimationStrategy;
  let sensory: PapikapiSensoryFeedbackAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: IBID_TACTILE_MOTION_CONFIG, useValue: PAPIKAPI_TACTILE_MOTION_CONFIG },
        PapikapiPlayfulAnimationStrategy,
        PapikapiSensoryFeedbackAdapter,
      ],
    });
    strategy = TestBed.inject(PapikapiPlayfulAnimationStrategy);
    sensory = TestBed.inject(PapikapiSensoryFeedbackAdapter);
  });

  it('applies playful press, release, blocked, missing-required and success states on elements', () => {
    const el = document.createElement('button');

    strategy.animatePress(el, 'primary');
    expect(el.getAttribute('data-motion-phase')).toBe('pressed');
    expect(el.style.getPropertyValue('--ibid-active-scale-x')).toBe('0.9');

    strategy.animateRelease(el, 'primary');
    expect(el.getAttribute('data-motion-phase')).toBe('releasing');

    strategy.animateBlocked(el);
    expect(el.getAttribute('data-motion-phase')).toBe('blocked');

    strategy.animateMissingRequired(el);
    expect(el.getAttribute('data-motion-alert')).toBe('missing-required');

    strategy.animateSuccess(el);
    expect(el.getAttribute('data-motion-alert')).toBe('success');
  });

  it('toggles sound state and safely handles sensory events', () => {
    expect(sensory.soundEnabled()).toBe(true);
    sensory.onPress('keypad');
    sensory.onRelease('keypad');
    sensory.onBlocked();
    sensory.onAttentionRequired();
    sensory.onSuccess();

    sensory.toggleSound();
    expect(sensory.soundEnabled()).toBe(false);
    sensory.onPress('primary');
  });
});
