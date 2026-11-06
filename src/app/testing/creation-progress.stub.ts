import { CreationProgressService } from '@application/services/creation-progress.service';

type CreationProgressApi = Pick<
  CreationProgressService,
  'connect' | 'triggerGeneration' | 'triggerPick' | 'checkInfo' | 'fetchCatalogue' | 'sheetUrl' | 'getLastError'
>;

export const creationProgressStub: CreationProgressApi = {
  connect: () => () => undefined,
  triggerGeneration: () => Promise.resolve(true),
  triggerPick: () => Promise.resolve(true),
  checkInfo: () => Promise.resolve(null),
  fetchCatalogue: () => Promise.resolve([]),
  sheetUrl: (figureId) =>
    `http://localhost:4502/api/creator/sheet?id=${encodeURIComponent(figureId)}`,
  getLastError: () => null,
};
