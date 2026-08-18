import { HttpInterceptorFn } from '@angular/common/http';

import { environment } from '../../../environments/environment';

const STORAGE_KEY = 'vitality-language';

export const localeInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiBaseUrl)) return next(req);
  let locale = 'pt-BR';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en-US' || stored === 'pt-BR') locale = stored;
  } catch {
    // Mantém o padrão quando o storage não estiver disponível.
  }
  return next(req.clone({ setHeaders: { 'Accept-Language': locale } }));
};
