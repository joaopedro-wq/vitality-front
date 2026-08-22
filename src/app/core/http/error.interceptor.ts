import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { TranslocoService } from '@jsverse/transloco';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { authPaths } from './api-paths';
import { AuthService } from '../auth/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastr = inject(ToastrService);
  const transloco = inject(TranslocoService);

  const isAuthRoute = req.url === authPaths.login() || req.url === authPaths.criarUsuario();

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && !isAuthRoute) {
        if (error.status === 401 && req.url.startsWith(environment.apiBaseUrl)) {
          // No bootstrap ainda não há usuário em memória. O guard decide a
          // primeira navegação; redirecionar aqui reentra no Router.
          if (authService.isAuthenticated()) {
            authService.forceLogout();
            router.navigate(['/login']);
          }
        } else {
          const message =
            (error.error as { message?: string } | null)?.message ??
            transloco.translate('common.errors.generic');
          toastr.error(message);
        }
      }

      return throwError(() => error);
    }),
  );
};
