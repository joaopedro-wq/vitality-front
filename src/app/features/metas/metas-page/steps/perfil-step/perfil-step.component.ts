import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../../core/auth/auth.service';
import type { Genero, User } from '../../../../../core/models/user.model';
import { UserService } from '../../../../../services/user.service';
import { StepFooterComponent } from '../../../../../components/molecules/step-footer/step-footer.component';


@Component({
  selector: 'vtp-perfil-step',
  standalone: true,
  imports: [ReactiveFormsModule, StepFooterComponent],
  templateUrl: './perfil-step.component.html',
  styleUrl: '../../metas-step.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilStepComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly toastr = inject(ToastrService);

  readonly concluido = output<User>();

  protected readonly salvando = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    peso: [0, [Validators.required, Validators.min(30), Validators.max(300)]],
    altura: [0, [Validators.required, Validators.min(100), Validators.max(250)]],
    idade: [0, [Validators.required, Validators.min(10), Validators.max(100)]],
    genero: ['M' as Genero, [Validators.required]],
  });

  constructor() {
    const user = this.authService.currentUser();
    if (!user) return;

    if (user.peso) this.form.controls.peso.setValue(user.peso);
    if (user.altura) this.form.controls.altura.setValue(user.altura);
    if (user.data_nascimento) {
      const idade = new Date().getFullYear() - new Date(user.data_nascimento).getFullYear();
      this.form.controls.idade.setValue(idade);
    }
    if (user.genero) this.form.controls.genero.setValue(user.genero);
  }

  confirmar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const user = this.authService.currentUser();
    if (!user) return;

    const { peso, altura, idade, genero } = this.form.getRawValue();
    // Só temos a idade, não a data de nascimento real — aproximamos por 1º de
    // janeiro do ano de nascimento. Suficiente pro cálculo de TMB, não é
    // registro preciso de data de nascimento (ver CLAUDE.md).
    const anoNascimento = new Date().getFullYear() - idade;

    this.salvando.set(true);
    this.userService
      .updateProfile(user.id, {
        name: user.name,
        email: user.email,
        peso,
        altura,
        genero,
        data_nascimento: `${anoNascimento}-01-01`,
      })
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: (userAtualizado) => this.concluido.emit(userAtualizado),
        error: () => this.toastr.error('Não foi possível salvar seu perfil agora. Tente de novo.'),
      });
  }
}
