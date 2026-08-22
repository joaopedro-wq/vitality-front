import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  LucideArrowDown,
  LucideArrowRight,
  LucideArrowUp,
  LucideDynamicIcon,
  type LucideIcon,
} from '@lucide/angular';
import { ToastrService } from 'ngx-toastr';
import { EMPTY, catchError, finalize } from 'rxjs';

import { StepFooterComponent } from '../../../../../components/molecules/step-footer/step-footer.component';
import { AuthService } from '../../../../../core/auth/auth.service';
import type {
  NivelAtividade,
  Objetivo,
  UpdateUserPayload,
  User,
} from '../../../../../core/models/user.model';
import { UserService } from '../../../../../services/user.service';

const ATIVIDADE_LABEL: Record<NivelAtividade, string> = {
  sedentario: 'Sedentário',
  leve: 'Leve',
  moderado: 'Moderado',
  intenso: 'Intenso',
  muito_intenso: 'Muito intenso',
};
const ATIVIDADE_INTENSIDADE: Record<NivelAtividade, number> = {
  sedentario: 1,
  leve: 2,
  moderado: 3,
  intenso: 4,
  muito_intenso: 5,
};
const ATIVIDADE_DESCRICAO: Record<NivelAtividade, string> = {
  sedentario: 'Quase não me exercito',
  leve: 'Treino 1 a 2x por semana',
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

@Component({
  selector: 'vtp-rotina-step',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoPipe, StepFooterComponent, LucideDynamicIcon],
  templateUrl: './rotina-step.component.html',
  host: { class: 'block animate-reveal' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RotinaStepComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly toastr = inject(ToastrService);

  readonly voltar = output<void>();
  readonly salvo = output<User>();
  protected readonly salvando = signal(false);
  protected readonly user = this.auth.currentUser;
  protected readonly atividadeOptions = Object.entries(ATIVIDADE_LABEL) as [
    NivelAtividade,
    string,
  ][];
  protected readonly objetivoOptions = Object.entries(OBJETIVO_LABEL) as [Objetivo, string][];
  protected readonly intensidade = ATIVIDADE_INTENSIDADE;
  protected readonly descricaoAtividade = ATIVIDADE_DESCRICAO;
  protected readonly objetivoIcone = OBJETIVO_ICONE;
  protected readonly pontosIntensidade = [1, 2, 3, 4, 5];
  protected readonly form = this.fb.nonNullable.group({
    nivel_atividade: ['moderado' as NivelAtividade, Validators.required],
    objetivo: ['manter' as Objetivo, Validators.required],
  });

  constructor() {
    const user = this.user();
    if (user)
      this.form.patchValue({
        nivel_atividade: user.nivel_atividade ?? 'moderado',
        objetivo: user.objetivo ?? 'manter',
      });
  }

  salvar(): void {
    const user = this.user();
    if (!user || this.salvando()) return;

    const valores = this.form.getRawValue();
    const payload: UpdateUserPayload = { name: user.name, email: user.email, ...valores };
    this.salvando.set(true);
    this.userService
      .updateProfile(payload)
      .pipe(
        finalize(() => this.salvando.set(false)),
        catchError(() => {
          this.toastr.error('Não foi possível salvar sua rotina agora. Tente de novo.');
          return EMPTY;
        }),
      )
      .subscribe((atualizado) => this.salvo.emit(atualizado));
  }

  protected atividadeAtual(): string {
    return ATIVIDADE_LABEL[this.form.controls.nivel_atividade.value] ?? '';
  }

  protected objetivoAtual(): string {
    return OBJETIVO_LABEL[this.form.controls.objetivo.value] ?? '';
  }
}
