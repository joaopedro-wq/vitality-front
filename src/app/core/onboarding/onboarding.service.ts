import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { apiPaths } from '../http/api-paths';
import type { ApiResponse } from '../models/api-response.model';
import type { OnboardingStatus, User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly toastr = inject(ToastrService);
  private readonly transloco = inject(TranslocoService);
  private automaticUserId: number | null = null;

  readonly open = signal(false);
  readonly step = signal(0);
  readonly saving = signal(false);
  readonly manual = signal(false);

  evaluateUser(user: User | null): void {
    if (!user) {
      this.automaticUserId = null;
      this.open.set(false);
      return;
    }
    if (this.automaticUserId === user.id) return;

    this.automaticUserId = user.id;
    if (user.onboarding_status === 'pending') {
      this.manual.set(false);
      this.step.set(0);
      this.open.set(true);
    }
  }

  restart(): void {
    this.manual.set(true);
    this.step.set(0);
    this.open.set(true);
  }

  previous(): void {
    this.step.update((current) => Math.max(0, current - 1));
  }

  next(): void {
    this.step.update((current) => Math.min(2, current + 1));
  }

  finish(): void {
    this.persist('completed');
  }

  dismiss(): void {
    if (this.manual()) {
      this.open.set(false);
      return;
    }
    this.persist('skipped');
  }

  private persist(status: Exclude<OnboardingStatus, 'pending'>): void {
    if (this.saving()) return;

    this.saving.set(true);
    this.http
      .put<ApiResponse<User>>(apiPaths.userOnboarding(), { status })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (response) => {
          this.auth.setCurrentUser(response.data);
          this.open.set(false);
        },
        error: () => this.toastr.error(this.transloco.translate('onboarding.saveError')),
      });
  }
}
