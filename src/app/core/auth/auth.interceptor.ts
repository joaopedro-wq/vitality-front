import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { authPaths } from '../http/api-paths';
import { TokenStorage } from './token.storage';

/** Rotas de auth vivem sob `apiBaseUrl` (ver api-paths.ts) mas nunca devem levar Bearer token. */
const SEM_AUTH = new Set([authPaths.login(), authPaths.criarUsuario()]);

/**
 * Injeta `Authorization: Bearer <token>` nas requisições para a API protegida
 * (`apiBaseUrl`), exceto login/criar-usuário — ainda não há token nessa hora,
 * ou não faz sentido mandar um token velho numa tentativa de login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorage);

  if (!req.url.startsWith(environment.apiBaseUrl) || SEM_AUTH.has(req.url)) {
    return next(req);
  }

  const token = tokenStorage.get();
  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
