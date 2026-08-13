import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../../core/auth/auth.service';
import type { NivelAtividade, Objetivo } from '../../../../../core/models/user.model';
import { calcularSugestaoRecomendacao, type SugestaoRecomendacao } from '../../../../../shared/utils/recomendacao-calc.util';
import { UserService } from '../../../../perfil/data/user.service';
import { StepFooterComponent } from '../step-footer/step-footer.component';

const ATIVIDADE_LABEL: Record<NivelAtividade, string> = {
  sedentario: 'Sedentário — quase não me exercito',
  leve: 'Leve — caminho ou treino 1 a 2x por semana',
  moderado: 'Moderado — treino 3 a 4x por semana',
  intenso: 'Intenso — treino quase todo dia',
  muito_intenso: 'Muito intenso — treino pesado todo dia',
};

const OBJETIVO_LABEL: Record<Objetivo, string> = {
  emagrecer: 'Emagrecer',
  manter: 'Manter o peso',
  ganhar_massa: 'Ganhar massa',
};


@Component({
  selector: 'vtp-atividade-step',
  standalone: true,
  imports: [ReactiveFormsModule, StepFooterComponent],
  templateUrl: './atividade-step.component.html',
  styleUrl: '../../metas-step.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtividadeStepComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly toastr = inject(ToastrService);

  readonly voltar = output<void>();
  readonly concluido = output<SugestaoRecomendacao>();

  protected readonly salvando = signal(false);
  protected readonly ativididadeOptions = Object.entries(ATIVIDADE_LABEL) as [NivelAtividade, string][];
  protected readonly objetivoOptions = Object.entries(OBJETIVO_LABEL) as [Objetivo, string][];

  protected readonly form = this.fb.nonNullable.group({
    nivel_atividade: ['moderado' as NivelAtividade, [Validators.required]],
    objetivo: ['manter' as Objetivo, [Validators.required]],
  });

  constructor() {
    const user = this.authService.currentUser();
    if (user?.nivel_atividade) this.form.controls.nivel_atividade.setValue(user.nivel_atividade);
    if (user?.objetivo) this.form.controls.objetivo.setValue(user.objetivo);
  }

  confirmar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const user = this.authService.currentUser();
    if (!user) return;

    const { nivel_atividade, objetivo } = this.form.getRawValue();

    this.salvando.set(true);
    this.userService
      .updateProfile(user.id, { name: user.name, email: user.email, nivel_atividade, objetivo })
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: (userAtualizado) => {
          const sugestao = calcularSugestaoRecomendacao(userAtualizado);
          if (!sugestao) {
            this.toastr.error('Faltou algum dado pra calcular sua sugestão. Revise o passo anterior.');
            return;
          }
          this.concluido.emit(sugestao);
        },
        error: () => this.toastr.error('Não foi possível salvar seus dados agora. Tente de novo.'),
      });
  }
}
