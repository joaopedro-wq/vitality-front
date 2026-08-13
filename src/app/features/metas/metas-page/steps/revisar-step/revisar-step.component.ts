import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize, forkJoin } from 'rxjs';

import type { SugestaoRecomendacao } from '../../../../../components/utils/recomendacao-calc.util';
import { RecomendacaoService } from '../../../../../services/recomendacao.service';
import { MetaService } from '../../../../../services/meta.service';
import { SomenteNumeroDirective } from '../../../../../components/directives/somente-numero.directive';
import { StepFooterComponent } from '../../../../../components/molecules/step-footer/step-footer.component';

/** Teto de escala de cada barra — só pra dar proporção visual, não é limite de validação. */
const ESCALA_MAX = {
  meta_calorias: 4000,
  meta_proteinas: 300,
  meta_carboidratos: 500,
  meta_gorduras: 150,
} as const;

type CampoMeta = keyof typeof ESCALA_MAX;

@Component({
  selector: 'vtp-revisar-step',
  standalone: true,
  imports: [ReactiveFormsModule, StepFooterComponent, SomenteNumeroDirective],
  templateUrl: './revisar-step.component.html',
  host: { class: 'card flex flex-col gap-5 p-6 md:p-8 animate-reveal' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RevisarStepComponent {
  private readonly fb = inject(FormBuilder);
  private readonly recomendacaoService = inject(RecomendacaoService);
  private readonly metaService = inject(MetaService);
  private readonly toastr = inject(ToastrService);

  readonly sugestao = input.required<SugestaoRecomendacao>();

  readonly voltar = output<void>();
  readonly salvo = output<void>();

  protected readonly salvando = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    meta_calorias: [0, [Validators.required, Validators.min(0)]],
    meta_proteinas: [0, [Validators.required, Validators.min(0)]],
    meta_carboidratos: [0, [Validators.required, Validators.min(0)]],
    meta_gorduras: [0, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    effect(() => {
      const s = this.sugestao();
      this.form.patchValue({
        meta_calorias: s.caloria,
        meta_proteinas: s.proteina,
        meta_carboidratos: s.carbo,
        meta_gorduras: s.gordura,
      });
    });
  }

  /** % preenchido da barra pro valor atual do campo — só decorativo. */
  protected pct(campo: CampoMeta): number {
    const valor = this.form.controls[campo].value;
    return Math.min(100, Math.max(0, (valor / ESCALA_MAX[campo]) * 100));
  }

  /** % onde fica a marca da sugestão original naquela mesma escala. */
  protected pctSugestao(campo: CampoMeta, valorSugerido: number): number {
    return Math.min(100, Math.max(0, (valorSugerido / ESCALA_MAX[campo]) * 100));
  }

  confirmar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const s = this.sugestao();
    const meta = this.form.getRawValue();

    this.salvando.set(true);
    forkJoin([
      this.recomendacaoService.save({
        tmb: s.tmb,
        get: s.get,
        caloria: s.caloria,
        proteina: s.proteina,
        carbo: s.carbo,
        gordura: s.gordura,
      }),
      this.metaService.save({ ...meta, data: null }),
    ])
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: () => {
          this.toastr.success('Meta salva! Já vale pro painel e pro diário.');
          this.salvo.emit();
        },
        error: () => this.toastr.error('Não foi possível salvar sua meta agora. Tente de novo.'),
      });
  }
}
