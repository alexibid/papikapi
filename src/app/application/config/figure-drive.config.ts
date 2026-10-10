import { InjectionToken } from '@angular/core';

export interface FigureDriveConfig {
  readonly indexFileId: string;
}

export const FIGURE_DRIVE_CONFIG: FigureDriveConfig = {
  indexFileId: '1_K-EHUZV00Z3JaEOmKBo-7rlRMsq2mHh',
};

export const FIGURE_DRIVE_CONFIG_TOKEN = new InjectionToken<FigureDriveConfig>(
  'FIGURE_DRIVE_CONFIG',
  { providedIn: 'root', factory: () => FIGURE_DRIVE_CONFIG }
);
