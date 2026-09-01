import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import {
  ApplicationConfig,
  EnvironmentProviders,
  importProvidersFrom,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { providePrimeNG } from 'primeng/config';
import { firstValueFrom } from 'rxjs';
import { isDevMode } from '@angular/core';
import { provideTransloco, TranslocoService, translocoConfig } from '@jsverse/transloco';
import { provideTranslocoLocale } from '@jsverse/transloco-locale';
import {
  BsNativeShellService,
  provideShellPalette,
  provideShellTheme,
  SHELL_NATIVE_CONFIG,
  type ShellNativeConfig,
} from 'bandeira-shell';

import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { TokenStore } from './core/auth/token.store';
import { authInterceptor } from './core/auth/auth.interceptor';
import { errorInterceptor } from './core/http/error.interceptor';
import { localeInterceptor } from './core/i18n/locale.interceptor';
import { VitalityPrimeNgPreset } from './core/layout/primeng-preset';
import { TranslocoHttpLoader } from './core/i18n/transloco-loader';
import { PALETAS, DEFAULT_PALETTE_ID } from './shell-palette.config';
import { ROTAS_RAIZ } from './shell-routes.config';

/**
 * `SHELL_NATIVE_CONFIG` via `useFactory` (não `provideShellNative()`, que só
 * aceita um valor estático) — os hooks `onExitConfirmRequested`/`onResume`
 * precisam de `ToastrService`/`TranslocoService`/`AuthService`, e `inject()`
 * só funciona durante a construção do provider, nunca dentro de um callback
 * chamado depois (ex.: no toque do botão físico de voltar). Por isso os
 * serviços são resolvidos aqui e capturados no closure, não injetados de
 * novo dentro dos hooks. Registra também o `provideAppInitializer` que
 * chama `BsNativeShellService.start()` — o mesmo papel que `provideShell()`
 * cumpriria automaticamente se os itens de navegação não precisassem de DI.
 */
function provideVitalityShellNative(rootRoutes: string[]): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: SHELL_NATIVE_CONFIG,
      useFactory: (): Required<ShellNativeConfig> => {
        const toastr = inject(ToastrService);
        const transloco = inject(TranslocoService);
        const auth = inject(AuthService);

        return {
          rootRoutes,
          exitConfirmWindowMs: 2000,
          autoStart: true,
          onExitConfirmRequested: () => {
            toastr.info(transloco.translate('common.app.exitHint'));
          },
          onResume: () => {
            if (auth.isAuthenticated()) auth.restoreSession().subscribe();
          },
        };
      },
    },
    provideAppInitializer(() => {
      const nativeConfig = inject(SHELL_NATIVE_CONFIG);
      if (nativeConfig.autoStart) inject(BsNativeShellService).start();
    }),
  ]);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
      withInterceptors([authInterceptor, localeInterceptor, errorInterceptor])
    ),
    provideTransloco({
      config: translocoConfig({
        availableLangs: ['pt-BR', 'en-US'],
        defaultLang: 'pt-BR',
        fallbackLang: 'pt-BR',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
        missingHandler: { useFallbackTranslation: true, logMissingKey: isDevMode() },
      }),
      loader: TranslocoHttpLoader,
    }),
    provideTranslocoLocale({ langToLocaleMapping: { 'pt-BR': 'pt-BR', 'en-US': 'en-US' } }),
    provideAnimations(),
    provideShellTheme(),
    provideShellPalette({ options: PALETAS, defaultId: DEFAULT_PALETTE_ID }),
    // `SHELL_NAVIGATION_CONFIG` NÃO entra aqui — é provider da rota que
    // lazy-carrega `AppShellComponent` (`app.routes.ts`), pra manter os
    // ícones Lucide dos itens de menu fora do bundle inicial. Ver
    // `provideVitalityShellNavigation` em `shell-nav.config.ts`.
    // Tem que ser aqui (root), não provider de rota lazy: `providePrimeNG`
    // registra sua config via `provideAppInitializer`, e isso só roda de
    // verdade no bootstrap raiz da aplicação — colocado num injector de rota
    // lazy (tentativa anterior, revertida), o initializer nunca dispara e o
    // `p-table` renderiza sem tema nenhum, sem erro nenhum no console.
    providePrimeNG({
      theme: { preset: VitalityPrimeNgPreset, options: { darkModeSelector: false } },
    }),
    importProvidersFrom(
      ToastrModule.forRoot({
        positionClass: 'toast-top-right',
        preventDuplicates: true,
        timeOut: 3500,
      })
    ),
    // Restaura a sessão (token -> usuário) antes da primeira navegação/guard rodar,
    // pra um refresh de página não jogar o usuário logado de volta pro /login.
    // O token vem de armazenamento assíncrono (TokenStore), então precisa ser
    // hidratado ANTES do /user — senão a requisição sai sem Authorization.
    // Sem token guardado, nem chega a chamar: numa rede móvel lenta, esse
    // 401 garantido atrasaria a primeira tela à toa.
    provideAppInitializer(() => {
      const tokenStore = inject(TokenStore);
      const auth = inject(AuthService);

      return tokenStore.load().then((token) => {
        if (!token) {
          auth.markBootstrapped();
          return null;
        }

        return firstValueFrom(auth.restoreSession());
      });
    }),
    // Botão físico de voltar, revalidação ao voltar do segundo plano, barra de
    // status e baixa da splash nativa. No-op no navegador. Fica aqui, e não no
    // componente raiz, pra não arrastar AuthService/HttpClient para dentro da
    // árvore de dependências de `App` — que é (e deve seguir) um casco vazio.
    // O motor em si (`BsNativeShellService`, dentro de `bandeira-shell`) não
    // conhece `AuthService`/`ToastrService` — os dois pontos de acoplamento
    // viram hooks (`onExitConfirmRequested`/`onResume`) resolvidos em
    // `provideVitalityShellNative`.
    provideVitalityShellNative(ROTAS_RAIZ),
  ],
};
