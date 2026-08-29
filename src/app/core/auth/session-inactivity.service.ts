import { Injectable, Injector, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';

import { PlatformService } from '../platform/platform.service';
import { AuthService } from './auth.service';
import { TOKEN_WEB_STORAGE_KEY } from './token.store';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_TIMEOUT_MS = 2 * 60 * 1000;
const ACTIVITY_THROTTLE_MS = 1000;
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll', 'focus'] as const;
const ACTIVITY_DEADLINE_KEY = 'vitality-session-idle-deadline';
const LOGOUT_KEY = 'vitality-session-logout';

const TOKEN_KEY = TOKEN_WEB_STORAGE_KEY;

@Injectable({ providedIn: 'root' })
export class SessionInactivityService {
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);
  private readonly platform = inject(PlatformService);
  private warningTimer: ReturnType<typeof setTimeout> | null = null;
  private logoutTimer: ReturnType<typeof setTimeout> | null = null;
  private navigationSubscription: Subscription | null = null;
  private started = false;
  private lastActivityAt = 0;
  private readonly activity = () => this.recordActivity();
  private readonly storageChange = (event: StorageEvent) => this.handleStorageChange(event);
  private readonly visibilityChange = () => {
    if (document.visibilityState === 'visible') this.recordActivity();
  };

  readonly warningOpen = signal(false);

  start(): void {
    if (this.started || typeof window === 'undefined') return;

    // Expirar por ociosidade faz sentido num navegador compartilhado; num app
    // instalado no aparelho da pessoa, só obriga a relogar toda vez que ele é
    // reaberto. O aparelho já tem a própria tela de bloqueio.
    if (this.platform.isNative) return;

    this.started = true;
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, this.activity, { passive: true })
    );
    window.addEventListener('storage', this.storageChange);
    document.addEventListener('visibilitychange', this.visibilityChange);
    this.navigationSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.recordActivity());

    this.renewDeadline();
  }

  stop(): void {
    if (typeof window === 'undefined') return;

    this.started = false;
    ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, this.activity));
    window.removeEventListener('storage', this.storageChange);
    document.removeEventListener('visibilitychange', this.visibilityChange);
    this.navigationSubscription?.unsubscribe();
    this.navigationSubscription = null;
    this.warningOpen.set(false);
    this.clearTimers();
  }

  continueSession(): void {
    if (!this.started) return;

    this.renewDeadline();
  }

  private recordActivity(): void {
    if (!this.started || this.warningOpen()) return;

    const now = Date.now();
    if (now - this.lastActivityAt < ACTIVITY_THROTTLE_MS) return;

    this.lastActivityAt = now;
    this.renewDeadline(now);
  }

  private renewDeadline(now = Date.now()): void {
    const deadline = now + IDLE_TIMEOUT_MS;
    this.lastActivityAt = now;
    this.warningOpen.set(false);
    this.persist(ACTIVITY_DEADLINE_KEY, String(deadline));
    this.schedule(deadline);
  }

  private schedule(deadline: number): void {
    this.clearTimers();

    const now = Date.now();
    this.warningTimer = setTimeout(
      () => this.warningOpen.set(true),
      Math.max(0, deadline - WARNING_TIMEOUT_MS - now)
    );
    this.logoutTimer = setTimeout(() => this.expire(), Math.max(0, deadline - now));
  }

  private expire(): void {
    this.persist(LOGOUT_KEY, String(Date.now()));
    this.injector
      .get(AuthService)
      .logout()
      .subscribe({ complete: () => this.finish() });
  }

  private handleStorageChange(event: StorageEvent): void {
    if (!this.started || event.storageArea !== localStorage) return;

    if ((event.key === TOKEN_KEY && !event.newValue) || event.key === LOGOUT_KEY) {
      this.finish();
      return;
    }

    if (event.key !== ACTIVITY_DEADLINE_KEY || !event.newValue) return;

    const deadline = Number(event.newValue);
    if (!Number.isFinite(deadline) || deadline <= Date.now()) {
      this.finish();
      return;
    }

    this.warningOpen.set(false);
    this.schedule(deadline);
  }

  private finish(): void {
    this.stop();
    this.injector.get(AuthService).forceLogout();
    void this.router.navigateByUrl('/login?reason=idle');
  }

  private persist(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Sem storage (ex.: modo privado), a proteção segue ativa nesta aba.
    }
  }

  private clearTimers(): void {
    if (this.warningTimer) clearTimeout(this.warningTimer);
    if (this.logoutTimer) clearTimeout(this.logoutTimer);
    this.warningTimer = null;
    this.logoutTimer = null;
  }
}
