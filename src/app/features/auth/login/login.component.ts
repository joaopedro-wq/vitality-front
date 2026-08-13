import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BdAlertComponent, BdButtonComponent, BdFieldComponent, BdInputComponent } from 'bandeira-ui';

import { AuthService } from '../../../core/auth/auth.service';
import { AuthPosterLayoutComponent } from '../../../components/organisms/auth-poster-layout/auth-poster-layout.component';

type LoginStatus = 'idle' | 'sending';

@Component({
  selector: 'vtp-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthPosterLayoutComponent,
    BdFieldComponent,
    BdInputComponent,
    BdButtonComponent,
    BdAlertComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly status = signal<LoginStatus>('idle');
  /** Erro específico do campo — distinto do toast genérico do errorInterceptor. */
  protected readonly emailError = signal<string | null>(null);
  protected readonly passwordError = signal<string | null>(null);
  protected readonly generalError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid || this.status() === 'sending') {
      this.form.markAllAsTouched();
      return;
    }

    this.emailError.set(null);
    this.passwordError.set(null);
    this.generalError.set(null);
    this.status.set('sending');

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err: unknown) => {
        this.status.set('idle');
        this.handleLoginError(err);
      },
    });
  }

  private handleLoginError(err: unknown): void {
    if (!(err instanceof HttpErrorResponse)) {
      this.generalError.set('Não foi possível entrar agora. Tente novamente.');
      return;
    }

    if (err.status === 401) {
      this.passwordError.set('Senha incorreta.');
      return;
    }

    if (err.status === 404) {
      this.emailError.set('Não encontramos uma conta com este e-mail.');
      return;
    }

    this.generalError.set('Não foi possível entrar agora. Tente novamente.');
  }
}
