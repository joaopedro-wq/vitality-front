import { Injectable, Injector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { AuthService } from './auth.service';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_TIMEOUT_MS = 28 * 60 * 1000;
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll', 'focus'] as const;

@Injectable({ providedIn: 'root' })
export class SessionInactivityService {
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);
  private warningTimer: ReturnType<typeof setTimeout> | null = null;
  private logoutTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly activity = () => this.reset();

  start(): void {
    this.stop();
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, this.activity, { passive: true }),
    );
    this.reset();
  }

  stop(): void {
    ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, this.activity));
    this.clearTimers();
  }

  private reset(): void {
    this.clearTimers();
    this.warningTimer = setTimeout(() => {
      this.toastr.info('Sua sessão será encerrada em 2 minutos por inatividade.');
    }, WARNING_TIMEOUT_MS);
    this.logoutTimer = setTimeout(() => this.expire(), IDLE_TIMEOUT_MS);
  }

  private expire(): void {
    this.injector
      .get(AuthService)
      .logout()
      .subscribe({
        complete: () => this.finish(),
        error: () => this.finish(),
      });
  }

  private finish(): void {
    this.injector.get(AuthService).forceLogout();
    this.router.navigateByUrl('/login?reason=idle');
    this.toastr.info('Sessão encerrada por inatividade.');
  }

  private clearTimers(): void {
    if (this.warningTimer) clearTimeout(this.warningTimer);
    if (this.logoutTimer) clearTimeout(this.logoutTimer);
    this.warningTimer = null;
    this.logoutTimer = null;
  }
}
