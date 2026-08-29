import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { PlatformService } from './platform.service';

export const nativeLandingGuard: CanActivateFn = () => {
  const platform = inject(PlatformService);

  if (!platform.isNative) return true;

  const router = inject(Router);
  const auth = inject(AuthService);

  return router.createUrlTree([auth.isAuthenticated() ? '/dashboard' : '/login']);
};
