import { Provider, inject } from '@angular/core';
import { SHELL_NAVIGATION_CONFIG, type ShellNavItem } from 'bandeira-shell';
import { TranslocoService } from '@jsverse/transloco';
import {
  LucideCarrot,
  LucideClipboardList,
  LucideHouse,
  LucideShieldCheck,
  LucideTarget,
  LucideUser,
  LucideUsers,
  LucideUsersRound,
  LucideUtensils,
} from '@lucide/angular';

import { AuthService } from './core/auth/auth.service';

/**
 * Itens do menu — específico do domínio Vitality PLUS (rotas, i18n, regra de
 * admin). O motor genérico de shell vem de `bandeira-shell` (ver `provideShell()`
 * em `app.config.ts`); este arquivo só monta a config que ele consome.
 *
 * `label`/`mobileLabel` são getters (não strings fixas) porque `bandeira-shell`
 * não conhece Transloco — chamar `transloco.translate(chave)` a cada leitura é
 * o que resolve a tradução da chave e reage à troca de idioma (a cada ciclo de
 * change detection, exatamente como `t(item.label)` fazia antes com a diretiva).
 */
export function buildNavItems(auth: AuthService, transloco: TranslocoService): ShellNavItem[] {
  const t = (chave: string) => () => transloco.translate(chave);

  return [
    {
      path: '/dashboard',
      label: t('common.shell.nav.dashboard'),
      icon: LucideHouse,
      data: { tour: 'onboarding-dashboard' },
    },
    {
      path: '/diario',
      label: t('common.shell.nav.diary'),
      icon: LucideUtensils,
      data: { tour: 'onboarding-diary' },
    },
    {
      path: '/alimentos',
      label: t('common.shell.nav.foods'),
      icon: LucideCarrot,
      mobileSlot: 'more',
    },
    {
      path: '/dietas',
      label: t('common.shell.nav.diets'),
      mobileLabel: t('common.shell.nav.plan'),
      icon: LucideClipboardList,
      data: { tour: 'onboarding-plans' },
    },
    {
      path: '/metas',
      label: t('common.shell.nav.goals'),
      icon: LucideTarget,
      data: { tour: 'onboarding-goals' },
    },
    {
      path: '/grupos',
      label: t('common.shell.nav.groups'),
      icon: LucideUsersRound,
      mobileSlot: 'more',
    },
    {
      path: '/perfil',
      label: t('common.shell.nav.profile'),
      icon: LucideUser,
      mobileSlot: 'more',
    },
    {
      path: '/admin/alimentos',
      label: t('common.shell.nav.catalog'),
      icon: LucideShieldCheck,
      visible: () => !!auth.currentUser()?.is_admin,
      mobileSlot: 'more',
    },
    {
      path: '/admin/usuarios',
      label: () => 'Usuários',
      icon: LucideUsers,
      visible: () => !!auth.currentUser()?.is_admin,
      mobileSlot: 'more',
    },
  ];
}

/**
 * Registrado nos `providers` do `@Component` de `AppShellComponent` — não na
 * rota (`app.routes.ts`, importada de forma eager por `app.config.ts`) nem
 * em `app.config.ts` (root, sempre eager). Um array `Provider[]` comum (não
 * `EnvironmentProviders`/`makeEnvironmentProviders`) porque só isso é aceito
 * em `providers` de componente; ele só é avaliado quando o `import()`
 * dinâmico do componente resolve, mantendo os ~9 ícones Lucide de
 * `buildNavItems()` (e o chunk de ícones que eles compartilham com outras
 * features) fora do bundle inicial — achado migrando pra `bandeira-shell`
 * (regressão de ~700kB→1.14MB revertida com esta mudança).
 */
export function provideVitalityShellNavigation(): Provider[] {
  return [
    {
      provide: SHELL_NAVIGATION_CONFIG,
      useFactory: () => buildNavItems(inject(AuthService), inject(TranslocoService)),
    },
  ];
}
