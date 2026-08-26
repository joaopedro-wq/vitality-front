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
    path: '',
    pathMatch: 'full',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/landing/landing-page/landing-page.component').then(
        (m) => m.LandingPageComponent,
      ),
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
      // Sem redirect próprio pra `''` aqui: a rota pública da landing lá em
      // cima já intercepta qualquer visita a `/` antes do Router sequer
      // considerar esta subárvore — chegar até aqui com path vazio é
      // impossível. Visitar `/` autenticado passa pelo `guestGuard` da
      // landing, que redireciona pro `/dashboard` e cai direto no filho
      // abaixo.
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
        path: 'dietas/novo',
        loadComponent: () =>
          import('./features/dietas/dieta-form/dieta-form.component').then(
            (m) => m.DietaFormComponent,
          ),
      },
      {
        path: 'dietas/novo/manual',
        loadComponent: () =>
          import('./features/dietas/manual-dieta-form/manual-dieta-form.component').then(
            (m) => m.ManualDietaFormComponent,
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
        path: 'grupos',
        loadComponent: () =>
          import('./features/grupos/grupos-page/grupos-page.component').then(
            (m) => m.GruposPageComponent,
          ),
      },
      {
        path: 'grupos/:id',
        loadComponent: () =>
          import('./features/grupos/grupo-detail/grupo-detail.component').then(
            (m) => m.GrupoDetailComponent,
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
      {
        path: 'admin/usuarios',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/admin/admin-users/admin-users.component').then(
            (m) => m.AdminUsersComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
