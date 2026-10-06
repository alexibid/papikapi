import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'molde',
    loadComponent: () => import('./pages/sheet/sheet.page').then((m) => m.SheetPage),
  },
  {
    path: 'adultos',
    loadComponent: () => import('./pages/gate/gate.page').then((m) => m.GatePage),
  },
  {
    path: 'pais',
    loadComponent: () =>
      import('./pages/backoffice/backoffice.page').then((m) => m.BackofficePage),
  },
  {
    path: 'diario',
    loadComponent: () => import('./pages/diary/diary.page').then((m) => m.DiaryPage),
  },
];
