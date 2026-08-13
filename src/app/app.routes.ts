import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';
import { adminGuard } from './core/auth/admin.guard';

export const routes: Routes = [
  {
    // Fase 0 do Plano B — remover quando o dashboard real (Fase 6) estiver pronto.
    path: 'ui-check',
    loadComponent: () =>
      import('./features/ui-check/ui-check.component').then((m) => m.UiCheckComponent),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layout/app-shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'diario',
        loadComponent: () =>
          import('./features/diario/diario-list/diario-list.component').then(
            (m) => m.DiarioListComponent,
          ),
      },
      {
        path: 'alimentos',
        loadComponent: () =>
          import('./features/alimentos/alimentos-list/alimentos-list.component').then(
            (m) => m.AlimentosListComponent,
          ),
      },
      {
        path: 'dietas',
        loadComponent: () =>
          import('./features/dietas/dietas-list/dietas-list.component').then(
            (m) => m.DietasListComponent,
          ),
      },
      {
        path: 'metas',
        loadComponent: () =>
          import('./features/metas/metas-page/metas-page.component').then(
            (m) => m.MetasPageComponent,
          ),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/perfil/perfil-page/perfil-page.component').then(
            (m) => m.PerfilPageComponent,
          ),
      },
      {
        path: 'admin/alimentos',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/alimentos/admin-foods/admin-foods.component').then(
            (m) => m.AdminFoodsComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
