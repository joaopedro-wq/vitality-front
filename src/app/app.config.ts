import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  importProvidersFrom,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { ToastrModule } from 'ngx-toastr';
import { providePrimeNG } from 'primeng/config';
import { firstValueFrom } from 'rxjs';
import { isDevMode } from '@angular/core';
import { provideTransloco, translocoConfig } from '@jsverse/transloco';
import { provideTranslocoLocale } from '@jsverse/transloco-locale';

import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { authInterceptor } from './core/auth/auth.interceptor';
import { errorInterceptor } from './core/http/error.interceptor';
import { VitalityPrimeNgPreset } from './core/layout/primeng-preset';
import { TranslocoHttpLoader } from './core/i18n/transloco-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
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
      }),
    ),
    // Restaura a sessão (token -> usuário) antes da primeira navegação/guard rodar,
    // pra um refresh de página não jogar o usuário logado de volta pro /login.
    provideAppInitializer(() => firstValueFrom(inject(AuthService).restoreSession())),
  ],
};
