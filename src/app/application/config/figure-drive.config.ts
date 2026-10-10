import { InjectionToken } from '@angular/core';

export interface FigureDriveConfig {
  readonly rootFolderId: string;
  readonly apiKey: string;
}

export const FIGURE_DRIVE_CONFIG: FigureDriveConfig = {
  rootFolderId: '',
  apiKey: '',
};

export const FIGURE_DRIVE_CONFIG_TOKEN = new InjectionToken<FigureDriveConfig>(
  'FIGURE_DRIVE_CONFIG',
  { providedIn: 'root', factory: () => FIGURE_DRIVE_CONFIG }
);
