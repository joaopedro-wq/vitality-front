import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BdAvatarComponent, BdButtonComponent, BdTooltipDirective } from 'bandeira-ui';

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


@Component({
  selector: 'vtp-app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BdAvatarComponent, BdButtonComponent, BdTooltipDirective],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  protected readonly navItems = NAV_ITEMS;

  /** Gaveta da sidebar no mobile (<900px) — some por padrão, some ao navegar. */
  protected readonly mobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closeMobileMenu();
  }

  protected readonly primeiroNome = computed(() => this.auth.currentUser()?.name?.split(' ')[0] ?? '');

  protected readonly saudacao = computed(() => {
    const hora = new Date().getHours();
    const periodo = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
    const nome = this.primeiroNome();
    return nome ? `${periodo}, ${nome}` : periodo;
  });

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}
