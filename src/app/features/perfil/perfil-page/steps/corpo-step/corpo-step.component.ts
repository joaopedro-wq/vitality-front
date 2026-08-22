import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { BdFieldComponent, BdInputComponent } from 'bandeira-ui';
import { ToastrService } from 'ngx-toastr';
import { EMPTY, catchError, finalize } from 'rxjs';

import { SomenteNumeroDirective } from '../../../../../components/directives/somente-numero.directive';
import { StepFooterComponent } from '../../../../../components/molecules/step-footer/step-footer.component';
import { AuthService } from '../../../../../core/auth/auth.service';
import type { UpdateUserPayload, User } from '../../../../../core/models/user.model';
import { UserService } from '../../../../../services/user.service';

@Component({
  selector: 'vtp-corpo-step',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    BdFieldComponent,
    BdInputComponent,
    SomenteNumeroDirective,
    StepFooterComponent,
  ],
  templateUrl: './corpo-step.component.html',
  host: { class: 'block animate-reveal' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CorpoStepComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly toastr = inject(ToastrService);

  readonly voltar = output<void>();
  readonly salvo = output<User>();
  protected readonly salvando = signal(false);
  protected readonly form = this.fb.nonNullable.group({
    peso: [0, [Validators.required, Validators.min(30), Validators.max(300)]],
    altura: [0, [Validators.required, Validators.min(100), Validators.max(250)]],
  });

  constructor() {
    const user = this.auth.currentUser();
    if (user) this.form.patchValue({ peso: user.peso ?? 0, altura: user.altura ?? 0 });
  }

  avancar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.error('Informe peso e altura válidos para continuar.');
      return;
    }
    const user = this.auth.currentUser();
    if (!user || this.salvando()) return;

    const valores = this.form.getRawValue();
    const payload: UpdateUserPayload = { name: user.name, email: user.email, ...valores };
    this.salvando.set(true);
    this.userService
      .updateProfile(payload)
      .pipe(
        finalize(() => this.salvando.set(false)),
        catchError(() => {
          this.toastr.error('Não foi possível salvar suas medidas agora. Tente de novo.');
          return EMPTY;
        }),
      )
      .subscribe((atualizado) => this.salvo.emit(atualizado));
  }
}
