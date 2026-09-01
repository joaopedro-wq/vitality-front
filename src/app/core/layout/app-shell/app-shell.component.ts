import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  BdAvatarComponent,
  BdButtonComponent,
  BdTooltipDirective,
  BdTourComponent,
} from 'bandeira-ui';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { BsShellComponent, type ShellLabels } from 'bandeira-shell/ui';
import { LucideLogOut, LucidePlus } from '@lucide/angular';

import { AuthService } from '../../auth/auth.service';
import { LanguageService } from '../../i18n/language.service';
import { LanguageSelectorComponent } from '../../../components/molecules/language-selector/language-selector.component';
import { ConfirmDialogComponent } from '../../../components/molecules/confirm-dialog/confirm-dialog.component';
import { SessionInactivityService } from '../../auth/session-inactivity.service';
import { OnboardingService } from '../../onboarding/onboarding.service';
import { OnboardingWelcomeComponent } from '../../onboarding/onboarding-welcome.component';
import { provideVitalityShellNavigation } from '../../../shell-nav.config';

@Component({
  selector: 'vtp-app-shell',
  standalone: true,
  providers: [provideVitalityShellNavigation()],
  imports: [
    RouterLink,
    BdAvatarComponent,
    BdButtonComponent,
    BdTooltipDirective,
    BsShellComponent,
    LucideLogOut,
    LucidePlus,
    LanguageSelectorComponent,
    ConfirmDialogComponent,
    BdTourComponent,
    OnboardingWelcomeComponent,
    TranslocoDirective,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly language = inject(LanguageService);
  private readonly transloco = inject(TranslocoService);
  private readonly router = inject(Router);
  protected readonly inactivity = inject(SessionInactivityService);
  private readonly onboarding = inject(OnboardingService);

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) this.inactivity.start();
      else this.inactivity.stop();
    });
    effect(() => this.onboarding.evaluateUser(this.auth.currentUser()));
  }

  protected readonly primeiroNome = computed(
    () => this.auth.currentUser()?.name?.split(' ')[0] ?? ''
  );

  protected readonly saudacaoPeriodo = computed(() => {
    this.language.locale();
    const hora = new Date().getHours();
    return this.transloco.translate(
      hora < 12
        ? 'common.shell.morning'
        : hora < 18
        ? 'common.shell.afternoon'
        : 'common.shell.evening'
    );
  });

  protected readonly saudacao = computed(() => {
    const periodo = this.saudacaoPeriodo();
    const nome = this.primeiroNome();
    return nome ? `${periodo}, ${nome}` : periodo;
  });

  protected readonly shellLabels = computed<ShellLabels>(() => {
    this.language.locale();
    const t = (chave: string) => this.transloco.translate(chave);
    return {
      mainNav: t('common.navigation.main'),
      profile: t('common.navigation.profile'),
      account: t('common.navigation.account'),
      palette: t('common.shell.palette'),
      lightTheme: t('common.shell.lightTheme'),
      darkTheme: t('common.shell.darkTheme'),
      horizontalMenu: t('common.shell.horizontalMenu'),
      sidebarMenu: t('common.shell.sidebarMenu'),
      close: t('common.actions.close'),
      moreOptions: t('common.navigation.moreOptions'),
      more: t('common.navigation.more'),
      loading: t('common.actions.loading'),
    };
  });

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}
