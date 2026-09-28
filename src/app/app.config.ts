import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { I18N_CONFIG_TOKEN } from '@ibid/services';
import { appRoutes } from './app.routes';
import { PAPIKAPI_I18N_CONFIG } from './i18n.config';
import { providePapikapiTheme } from './theme.config';
import { providePapikapiDevBridge } from '@application/services/dev-bridge';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    { provide: I18N_CONFIG_TOKEN, useValue: PAPIKAPI_I18N_CONFIG },
    ...providePapikapiTheme(),
    providePapikapiDevBridge(),
  ],
};
