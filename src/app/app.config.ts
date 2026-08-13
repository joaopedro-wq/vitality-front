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
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { authInterceptor } from './core/auth/auth.interceptor';
import { errorInterceptor } from './core/http/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimations(),
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
