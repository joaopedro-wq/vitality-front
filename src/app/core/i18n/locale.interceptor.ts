import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { LanguageService } from './language.service';

export const localeInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiBaseUrl)) return next(req);

  // O LanguageService já é a fonte de verdade do idioma ativo (signal + storage);
  // ler dele evita um segundo acesso ao localStorage no caminho de toda requisição.
  const locale = inject(LanguageService).locale();

  return next(req.clone({ setHeaders: { 'Accept-Language': locale } }));
};
