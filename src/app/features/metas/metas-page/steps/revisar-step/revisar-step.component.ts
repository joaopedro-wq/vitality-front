import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize, forkJoin } from 'rxjs';

import type { SugestaoRecomendacao } from '../../../../../shared/utils/recomendacao-calc.util';
import { RecomendacaoService } from '../../../../recomendacao/data/recomendacao.service';
import { MetaService } from '../../../data/meta.service';
import { StepFooterComponent } from '../step-footer/step-footer.component';


@Component({
  selector: 'vtp-revisar-step',
  standalone: true,
  imports: [ReactiveFormsModule, StepFooterComponent],
  templateUrl: './revisar-step.component.html',
  styleUrl: '../../metas-step.scss',
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
