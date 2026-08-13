import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BdAvatarComponent, BdButtonComponent, BdTooltipDirective } from 'bandeira-ui';
import {
  LucideCarrot,
  LucideClipboardList,
  LucideShieldCheck,
  LucideDynamicIcon,
  LucideHouse,
  LucideLogOut,
  LucideMenu,
  LucideMoon,
  LucidePalette,
  LucidePlus,
  LucideSun,
  LucideTarget,
  LucideUser,
  LucideUtensils,
  type LucideIcon,
} from '@lucide/angular';

import { AuthService } from '../../auth/auth.service';
import { PaletteService, type PaletteId } from '../palette.service';
import { ThemeService } from '../theme.service';
import { PalettePickerComponent } from '../../../components/molecules/palette-picker/palette-picker.component';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Painel', icon: LucideHouse },
  { path: '/diario', label: 'Diário', icon: LucideUtensils },
  { path: '/alimentos', label: 'Alimentos', icon: LucideCarrot },
  { path: '/dietas', label: 'Dietas', icon: LucideClipboardList },
  { path: '/metas', label: 'Metas', icon: LucideTarget },
  { path: '/perfil', label: 'Perfil', icon: LucideUser },
  { path: '/admin/alimentos', label: 'Catálogo', icon: LucideShieldCheck, adminOnly: true },
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
    LucidePalette,
    PalettePickerComponent,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  protected readonly palette = inject(PaletteService);
  private readonly router = inject(Router);
  @ViewChild('paletteControl') private paletteControl?: ElementRef<HTMLElement>;

  protected readonly navItems = NAV_ITEMS;
  protected readonly navItemsVisiveis = computed(() =>
    NAV_ITEMS.filter((item) => !item.adminOnly || this.auth.currentUser()?.is_admin),
  );

  /** Gaveta da sidebar no mobile (<900px) — some por padrão, some ao navegar. */
  protected readonly mobileMenuOpen = signal(false);
  protected readonly paletaMenuAberto = signal(false);

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  togglePaletaMenu(): void {
    this.paletaMenuAberto.update((aberto) => !aberto);
  }

  escolherPaleta(id: PaletteId): void {
    this.palette.set(id);
    this.paletaMenuAberto.set(false);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closeMobileMenu();
    this.paletaMenuAberto.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.paletteControl?.nativeElement.contains(event.target as Node)) {
      this.paletaMenuAberto.set(false);
    }
  }

  protected readonly primeiroNome = computed(
    () => this.auth.currentUser()?.name?.split(' ')[0] ?? '',
  );

  protected readonly saudacaoPeriodo = computed(() => {
    const hora = new Date().getHours();
    return hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  });

  protected readonly saudacao = computed(() => {
    const periodo = this.saudacaoPeriodo();
    const nome = this.primeiroNome();
    return nome ? `${periodo}, ${nome}` : periodo;
  });

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}
