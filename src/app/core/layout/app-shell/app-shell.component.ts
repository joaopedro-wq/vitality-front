import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BdAvatarComponent, BdButtonComponent, BdTooltipDirective } from 'bandeira-ui';
import {
  LucideCarrot,
  LucideClipboardList,
  LucideDynamicIcon,
  LucideHouse,
  LucideLogOut,
  LucideMenu,
  LucideMoon,
  LucidePlus,
  LucideSun,
  LucideTarget,
  LucideUser,
  LucideUtensils,
  type LucideIcon,
} from '@lucide/angular';

import { AuthService } from '../../auth/auth.service';
import { ThemeService } from '../theme.service';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Painel', icon: LucideHouse },
  { path: '/diario', label: 'Diário', icon: LucideUtensils },
  { path: '/alimentos', label: 'Alimentos', icon: LucideCarrot },
  { path: '/dietas', label: 'Dietas', icon: LucideClipboardList },
  { path: '/metas', label: 'Metas', icon: LucideTarget },
  { path: '/perfil', label: 'Perfil', icon: LucideUser },
];


@Component({
  selector: 'vtp-app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    BdAvatarComponent,
    BdButtonComponent,
    BdTooltipDirective,
    LucideDynamicIcon,
    LucideMenu,
    LucidePlus,
    LucideLogOut,
    LucideSun,
    LucideMoon,
  ],
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
