import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import {
  LucideCalendarDays,
  LucideDynamicIcon,
  LucideMars,
  LucideRuler,
  LucideScale,
  LucideUser,
  LucideUsersRound,
  LucideVenus,
  type LucideIcon,
} from '@lucide/angular';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../../core/auth/auth.service';
import type { Genero, User } from '../../../../../core/models/user.model';
import { UserService } from '../../../../../services/user.service';
import { SomenteNumeroDirective } from '../../../../../components/directives/somente-numero.directive';
import { StepFooterComponent } from '../../../../../components/molecules/step-footer/step-footer.component';

interface GeneroOption {
  valor: Genero;
  label: string;
  icone: LucideIcon;
}

const GENERO_OPTIONS: GeneroOption[] = [
  { valor: 'M', label: 'Masculino', icone: LucideMars },
  { valor: 'F', label: 'Feminino', icone: LucideVenus },
  { valor: 'O', label: 'Outro', icone: LucideUsersRound },
];

@Component({
  selector: 'vtp-perfil-step',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    StepFooterComponent,
    SomenteNumeroDirective,
    LucideUser,
    LucideScale,
    LucideRuler,
    LucideCalendarDays,
    LucideDynamicIcon,
  ],
  templateUrl: './perfil-step.component.html',
  host: { class: 'card flex flex-col gap-5 p-6 md:p-8 animate-reveal' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilStepComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly toastr = inject(ToastrService);

  readonly concluido = output<User>();

  protected readonly salvando = signal(false);
  protected readonly generoOptions = GENERO_OPTIONS;

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
