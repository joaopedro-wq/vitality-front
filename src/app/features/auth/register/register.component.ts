import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  BdAlertComponent,
  BdButtonComponent,
  BdFieldComponent,
  BdInputComponent,
} from 'bandeira-ui';
import { ToastrService } from 'ngx-toastr';

import { AuthService } from '../../../core/auth/auth.service';
import { AuthPosterLayoutComponent } from '../../../components/organisms/auth-poster-layout/auth-poster-layout.component';
import { PlateLoaderComponent } from '../../../components/atoms/plate-loader/plate-loader.component';
import { PageTitleComponent } from '../../../components/molecules/page-title/page-title.component';

type RegisterStatus = 'idle' | 'sending';

function passwordsMatch(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const senha = group.get('password')?.value;
    const confirmacao = group.get('password_confirmation')?.value;
    return senha && confirmacao && senha !== confirmacao ? { passwordsMismatch: true } : null;
  };
}

@Component({
  selector: 'vtp-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthPosterLayoutComponent,
    PlateLoaderComponent,
    PageTitleComponent,
    BdFieldComponent,
    BdInputComponent,
    BdButtonComponent,
    BdAlertComponent,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  protected readonly status = signal<RegisterStatus>('idle');
  protected readonly generalError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirmation: ['', [Validators.required]],
    },
    { validators: passwordsMatch() },
  );

  submit(): void {
    if (this.form.invalid || this.status() === 'sending') {
      this.form.markAllAsTouched();
      return;
    }

    this.generalError.set(null);
    this.status.set('sending');

    this.authService.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.status.set('idle');
        this.toastr.success('Conta criada! Faça login para continuar.');
        this.router.navigateByUrl('/login');
      },
      error: (err: unknown) => {
        this.status.set('idle');
        if (err instanceof HttpErrorResponse && err.error?.message) {
          this.generalError.set(err.error.message);
        } else {
          this.generalError.set('Não foi possível criar sua conta agora. Tente novamente.');
        }
      },
    });
  }
}
