import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { I18N_CONFIG_TOKEN } from '@ibid/services';
import { appRoutes } from './app.routes';
import { PAPIKAPI_I18N_CONFIG } from './i18n.config';
import { providePapikapiTheme } from './theme.config';
import { providePapikapiDevBridge } from '@application/services/dev-bridge';
import { pointsReducer } from '@application/state/points.reducer';
import { PointsEffects } from '@application/state/points.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideStore({ points: pointsReducer }),
    provideEffects([PointsEffects]),
    { provide: I18N_CONFIG_TOKEN, useValue: PAPIKAPI_I18N_CONFIG },
    ...providePapikapiTheme(),
    providePapikapiDevBridge(),
  ],
};
