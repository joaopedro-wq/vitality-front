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
import { TranslocoDirective } from '@jsverse/transloco';
import { TranslocoService } from '@jsverse/transloco';
import {
  LucideCarrot,
  LucideClipboardList,
  LucideDynamicIcon,
  LucideEllipsis,
  LucideHouse,
  LucideLogOut,
  LucideMoon,
  LucidePalette,
  LucidePanelLeft,
  LucidePanelTop,
  LucidePlus,
  LucideShieldCheck,
  LucideSun,
  LucideTarget,
  LucideUser,
  LucideUtensils,
  type LucideIcon,
} from '@lucide/angular';

import { PalettePickerComponent } from '../../../components/molecules/palette-picker/palette-picker.component';
import { AuthService } from '../../auth/auth.service';
import { LoadingStateComponent } from '../../../components/molecules/loading-state/loading-state.component';
import { gateCarregamento } from '../../../components/utils/loading-gate.util';
import { NavegacaoService } from '../navegacao.service';
import { NavigationLayoutService } from '../navigation-layout.service';
import { PaletteService, type PaletteId } from '../palette.service';
import { ThemeService } from '../theme.service';
import { LanguageService } from '../../i18n/language.service';
import { LanguageSelectorComponent } from '../../../components/molecules/language-selector/language-selector.component';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'common.shell.nav.dashboard', icon: LucideHouse },
  { path: '/diario', label: 'common.shell.nav.diary', icon: LucideUtensils },
  { path: '/alimentos', label: 'common.shell.nav.foods', icon: LucideCarrot },
  { path: '/dietas', label: 'common.shell.nav.diets', icon: LucideClipboardList },
  { path: '/metas', label: 'common.shell.nav.goals', icon: LucideTarget },
  { path: '/perfil', label: 'common.shell.nav.profile', icon: LucideUser },
  {
    path: '/admin/alimentos',
    label: 'common.shell.nav.catalog',
    icon: LucideShieldCheck,
    adminOnly: true,
  },
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
    LucideEllipsis,
    LucidePlus,
    LucideLogOut,
    LucideSun,
    LucideMoon,
    LucidePalette,
    LucidePanelLeft,
    LucidePanelTop,
    PalettePickerComponent,
    LoadingStateComponent,
    LanguageSelectorComponent,
    TranslocoDirective,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  protected readonly language = inject(LanguageService);
  private readonly transloco = inject(TranslocoService);
  protected readonly palette = inject(PaletteService);
  protected readonly navigationLayout = inject(NavigationLayoutService);
  private readonly navegacao = inject(NavegacaoService);
  protected readonly navegandoVisivel = gateCarregamento(this.navegacao.navegando);
  private readonly router = inject(Router);
  @ViewChild('paletteControl') private paletteControl?: ElementRef<HTMLElement>;

  protected readonly navItemsVisiveis = computed(() =>
    NAV_ITEMS.filter((item) => !item.adminOnly || this.auth.currentUser()?.is_admin),
  );
  protected readonly mobileNavItems = computed(() =>
    this.navItemsVisiveis().filter(
      (item) => !['/dietas', '/perfil', '/admin/alimentos'].includes(item.path),
    ),
  );
  protected readonly mobileMoreItems = computed(() =>
    this.navItemsVisiveis().filter((item) =>
      ['/dietas', '/perfil', '/admin/alimentos'].includes(item.path),
    ),
  );

  protected readonly mobileMoreOpen = signal(false);
  protected readonly paletaMenuAberto = signal(false);

  toggleMobileMore(): void {
    this.mobileMoreOpen.update((open) => !open);
  }

  closeMobileMore(): void {
    this.mobileMoreOpen.set(false);
  }

  isMobileMoreActive(): boolean {
    return this.mobileMoreItems().some((item) => this.router.url.startsWith(item.path));
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
    this.closeMobileMore();
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
    this.language.locale();
    const hora = new Date().getHours();
    return this.transloco.translate(
      hora < 12
        ? 'common.shell.morning'
        : hora < 18
          ? 'common.shell.afternoon'
          : 'common.shell.evening',
    );
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
