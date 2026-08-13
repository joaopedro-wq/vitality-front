import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { authPaths } from './api-paths';
import { AuthService } from '../auth/auth.service';

/**
 * Tratamento genérico de erro HTTP:
 * - 401 em rota protegida -> derruba a sessão local e manda pro /login.
 * - Demais erros -> toast com a mensagem do backend (fallback genérico).
 *
 * O login/registro tratam os próprios erros por campo (401 senha errada,
 * 404 e-mail não encontrado) e não devem cair aqui — por isso as rotas de
 * auth são explicitamente ignoradas.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastr = inject(ToastrService);

  const isAuthRoute = req.url === authPaths.login() || req.url === authPaths.criarUsuario();

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && !isAuthRoute) {
        if (error.status === 401 && req.url.startsWith(environment.apiBaseUrl)) {
          authService.forceLogout();
          router.navigate(['/login']);
        } else {
          const message = (error.error as { message?: string } | null)?.message
            ?? 'Não foi possível completar a operação. Tente novamente.';
          toastr.error(message);
        }
      }

      return throwError(() => error);
    }),
  );
};
