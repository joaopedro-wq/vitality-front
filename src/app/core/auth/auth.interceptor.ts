import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { TokenStore } from './token.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const token = inject(TokenStore).token();

  return next(
    req.clone({
      setHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    })
  );
};
