import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BdAppShellComponent, BdAvatarComponent, BdButtonComponent, BdTooltipDirective } from 'bandeira-ui';

import { AuthService } from '../../auth/auth.service';
import { ThemeService } from '../theme.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Painel', icon: 'fas fa-house' },
  { path: '/diario', label: 'Diário', icon: 'fas fa-utensils' },
  { path: '/alimentos', label: 'Alimentos', icon: 'fas fa-carrot' },
  { path: '/dietas', label: 'Dietas', icon: 'fas fa-clipboard-list' },
  { path: '/metas', label: 'Metas', icon: 'fas fa-bullseye' },
  { path: '/perfil', label: 'Perfil', icon: 'fas fa-user' },
];

/** Layout autenticado: navegação, tema, avatar e logout — Fase 2 do Plano B. */
@Component({
  selector: 'vtp-app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    BdAppShellComponent,
    BdAvatarComponent,
    BdButtonComponent,
    BdTooltipDirective,
  ],
  templateUrl: './app-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  protected readonly navItems = NAV_ITEMS;

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}
