import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BsPlatformService } from 'bandeira-shell';

import { AuthService } from '../auth/auth.service';

export const nativeLandingGuard: CanActivateFn = () => {
  const platform = inject(BsPlatformService);

  if (!platform.isNative) return true;

  const router = inject(Router);
  const auth = inject(AuthService);

  return router.createUrlTree([auth.isAuthenticated() ? '/dashboard' : '/login']);
};
