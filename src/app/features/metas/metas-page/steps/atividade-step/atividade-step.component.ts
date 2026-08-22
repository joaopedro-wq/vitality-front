import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import {
  LucideArrowDown,
  LucideArrowRight,
  LucideArrowUp,
  LucideDynamicIcon,
  type LucideIcon,
} from '@lucide/angular';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../../core/auth/auth.service';
import type { NivelAtividade, Objetivo } from '../../../../../core/models/user.model';
import {
  calcularSugestaoRecomendacao,
  type SugestaoRecomendacao,
} from '../../../../../components/utils/recomendacao-calc.util';
import { UserService } from '../../../../../services/user.service';
import { StepFooterComponent } from '../../../../../components/molecules/step-footer/step-footer.component';

const ATIVIDADE_LABEL: Record<NivelAtividade, string> = {
  sedentario: 'Sedentário',
  leve: 'Leve',
  moderado: 'Moderado',
  intenso: 'Intenso',
  muito_intenso: 'Muito intenso',
};

/** Quantos "pontos de intensidade" (de 5) cada nível acende dentro do chip. */
const ATIVIDADE_INTENSIDADE: Record<NivelAtividade, number> = {
  sedentario: 1,
  leve: 2,
  moderado: 3,
  intenso: 4,
  muito_intenso: 5,
};

/** Legenda do nível selecionado — mostrada como uma linha abaixo do grupo de
 * chips (não cabe mais dentro do chip, que ficou compacto). */
const ATIVIDADE_DESCRICAO: Record<NivelAtividade, string> = {
  sedentario: 'Quase não me exercito',
  leve: 'Caminho ou treino 1 a 2x por semana',
  moderado: 'Treino 3 a 4x por semana',
  intenso: 'Treino quase todo dia',
  muito_intenso: 'Treino pesado todo dia',
};

const OBJETIVO_LABEL: Record<Objetivo, string> = {
  emagrecer: 'Perder gordura',
  manter: 'Manter o peso',
  ganhar_massa: 'Ganhar massa',
};

const OBJETIVO_ICONE: Record<Objetivo, LucideIcon> = {
  emagrecer: LucideArrowDown,
  manter: LucideArrowRight,
  ganhar_massa: LucideArrowUp,
};

/** Prévia de impacto exibida ao escolher o objetivo — não revela número
 * nenhum, só alimenta a curiosidade pro passo de Sugestão. */
const OBJETIVO_IMPACTO: Record<Objetivo, string> = {
  emagrecer: 'Isso empurra sua meta pra baixo ↓',
  manter: 'Isso mantém sua meta equilibrada →',
  ganhar_massa: 'Isso empurra sua meta pra cima ↑',
};

@Component({
  selector: 'vtp-atividade-step',
  standalone: true,
  imports: [ReactiveFormsModule, StepFooterComponent, LucideDynamicIcon],
  templateUrl: './atividade-step.component.html',
  host: { class: 'card flex flex-col gap-5 p-6 md:p-8 animate-reveal' },
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
  protected readonly ativididadeOptions = Object.entries(ATIVIDADE_LABEL) as [
    NivelAtividade,
    string,
  ][];
  protected readonly objetivoOptions = Object.entries(OBJETIVO_LABEL) as [Objetivo, string][];
  protected readonly intensidade = ATIVIDADE_INTENSIDADE;
  protected readonly descricaoAtividade = ATIVIDADE_DESCRICAO;
  protected readonly objetivoIcone = OBJETIVO_ICONE;
  protected readonly objetivoImpacto = OBJETIVO_IMPACTO;
  protected readonly pontosIntensidade = [1, 2, 3, 4, 5];

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
      .updateProfile({ name: user.name, email: user.email, nivel_atividade, objetivo })
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: (userAtualizado) => {
          this.authService.setCurrentUser(userAtualizado);
          const sugestao = calcularSugestaoRecomendacao(userAtualizado);
          if (!sugestao) {
            this.toastr.error(
              'Faltou algum dado pra calcular sua sugestão. Revise o passo anterior.',
            );
            return;
          }
          this.concluido.emit(sugestao);
        },
        error: () => this.toastr.error('Não foi possível salvar seus dados agora. Tente de novo.'),
      });
  }
}
