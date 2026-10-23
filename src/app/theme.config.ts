import {
  EnvironmentProviders,
  Provider,
  inject,
  provideEnvironmentInitializer,
} from '@angular/core';
import { THEME_CONFIG_TOKEN, ThemeConfig, ThemeService } from '@ibid/services';
import {
  IBID_INTERACTION_ANIMATION_STRATEGY,
  IBID_SENSORY_FEEDBACK_PORT,
  IBID_TACTILE_MOTION_CONFIG,
} from 'ibid-ui';
import {
  PAPIKAPI_TACTILE_MOTION_CONFIG,
  PapikapiPlayfulAnimationStrategy,
} from '@ui/interaction/papikapi-playful-animation.strategy';
import { PapikapiSensoryFeedbackAdapter } from '@ui/interaction/papikapi-sensory-feedback.adapter';

export const PAPIKAPI_THEME_CONFIG: ThemeConfig = {
  themes: [{ id: 'papikapi', label: 'Papikapi' }],
  defaultTheme: 'papikapi',
};

const wearConfiguredTheme = (): void => {
  inject(ThemeService);
};

export function providePapikapiTheme(): readonly (Provider | EnvironmentProviders)[] {
  return [
    { provide: THEME_CONFIG_TOKEN, useValue: PAPIKAPI_THEME_CONFIG },
    { provide: IBID_TACTILE_MOTION_CONFIG, useValue: PAPIKAPI_TACTILE_MOTION_CONFIG },
    {
      provide: IBID_INTERACTION_ANIMATION_STRATEGY,
      useExisting: PapikapiPlayfulAnimationStrategy,
    },
    {
      provide: IBID_SENSORY_FEEDBACK_PORT,
      useExisting: PapikapiSensoryFeedbackAdapter,
    },
    provideEnvironmentInitializer(wearConfiguredTheme),
  ];
}
