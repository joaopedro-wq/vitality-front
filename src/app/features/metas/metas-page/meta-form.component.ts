import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BdButtonComponent, BdCardComponent, BdFieldComponent, BdInputComponent } from 'bandeira-ui';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

import type { NutricaoRecomendada } from '../../../core/models/nutricao-recomendada.model';
import { RecomendacaoService } from '../../recomendacao/data/recomendacao.service';
import { MetaService } from '../data/meta.service';

type Status = 'loading' | 'idle' | 'saving';

@Component({
  selector: 'vtp-meta-form',
  standalone: true,
  imports: [ReactiveFormsModule, BdCardComponent, BdFieldComponent, BdInputComponent, BdButtonComponent],
  templateUrl: './meta-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetaFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly metaService = inject(MetaService);
  private readonly recomendacaoService = inject(RecomendacaoService);
  private readonly toastr = inject(ToastrService);

  protected readonly status = signal<Status>('loading');
  private recomendacaoAtual: NutricaoRecomendada | null = null;

  protected readonly form = this.fb.nonNullable.group({
    meta_calorias: [0, [Validators.required, Validators.min(0)]],
    meta_proteinas: [0, [Validators.required, Validators.min(0)]],
    meta_carboidratos: [0, [Validators.required, Validators.min(0)]],
    meta_gorduras: [0, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    this.metaService.list().subscribe({
      next: (existing) => {
        const vigente = existing.find((m) => m.data === null) ?? existing[0];
        if (vigente) this.form.patchValue(vigente);
        this.status.set('idle');
      },
      error: () => this.status.set('idle'),
    });

    this.recomendacaoService.list().subscribe({
      next: (existing) => {
        this.recomendacaoAtual = existing[0] ?? null;
      },
    });
  }

  get temRecomendacao(): boolean {
    return this.recomendacaoAtual !== null;
  }

  usarRecomendacao(): void {
    if (!this.recomendacaoAtual) return;
    this.form.patchValue({
      meta_calorias: this.recomendacaoAtual.caloria,
      meta_proteinas: this.recomendacaoAtual.proteina,
      meta_carboidratos: this.recomendacaoAtual.carbo,
      meta_gorduras: this.recomendacaoAtual.gordura,
    });
    this.form.markAsDirty();
  }

  submit(): void {
    if (this.form.invalid || this.status() === 'saving') {
      this.form.markAllAsTouched();
      return;
    }

    this.status.set('saving');
    this.metaService
      .save({ ...this.form.getRawValue(), data: null })
      .pipe(finalize(() => this.status.set('idle')))
      .subscribe({
        next: () => {
          this.form.markAsPristine();
          this.toastr.success('Meta diária salva.');
        },
      });
  }
}
