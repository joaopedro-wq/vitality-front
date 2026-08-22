import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const token = localStorage.getItem('vitality_token');

  return next(req.clone({
    setHeaders: token ? { Authorization: `Bearer ${token}` } : {},
  }));
};
