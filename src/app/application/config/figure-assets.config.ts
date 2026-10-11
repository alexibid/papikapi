import { InjectionToken } from '@angular/core';

export const FIGURE_ASSETS_BASE_URL = new InjectionToken<string>('FIGURE_ASSETS_BASE_URL', {
  providedIn: 'root',
  factory: () => 'https://ibid-assets.web.app/papikapi/figures',
});
