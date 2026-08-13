import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BdAlertComponent, BdButtonComponent, BdCardComponent, BdFieldComponent, BdInputComponent } from 'bandeira-ui';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { calcularSugestaoRecomendacao } from '../../../shared/utils/recomendacao-calc.util';
import { RecomendacaoService } from '../data/recomendacao.service';

type Status = 'loading' | 'idle' | 'saving';

@Component({
  selector: 'vtp-recomendacao-form',
  standalone: true,
  imports: [ReactiveFormsModule, BdCardComponent, BdFieldComponent, BdInputComponent, BdButtonComponent, BdAlertComponent],
  templateUrl: './recomendacao-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecomendacaoFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly recomendacaoService = inject(RecomendacaoService);
  private readonly authService = inject(AuthService);
  private readonly toastr = inject(ToastrService);

  protected readonly status = signal<Status>('loading');

  protected readonly sugestao = computed(() => calcularSugestaoRecomendacao(this.authService.currentUser()));

  protected readonly form = this.fb.nonNullable.group({
    tmb: [0, [Validators.required, Validators.min(0)]],
    get: [0, [Validators.required, Validators.min(0)]],
    caloria: [0, [Validators.required, Validators.min(0)]],
    proteina: [0, [Validators.required, Validators.min(0)]],
    carbo: [0, [Validators.required, Validators.min(0)]],
    gordura: [0, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    this.recomendacaoService.list().subscribe({
      next: (existing) => {
        if (existing.length > 0) {
          const atual = existing[0];
          this.form.patchValue(atual);
        } else {
          const sugestao = this.sugestao();
          if (sugestao) this.form.patchValue(sugestao);
        }
        this.status.set('idle');
      },
      error: () => this.status.set('idle'),
    });
  }

  aplicarSugestao(): void {
    const sugestao = this.sugestao();
    if (sugestao) {
      this.form.patchValue(sugestao);
      this.form.markAsDirty();
    }
  }

  submit(): void {
    if (this.form.invalid || this.status() === 'saving') {
      this.form.markAllAsTouched();
      return;
    }

    this.status.set('saving');
    this.recomendacaoService
      .save(this.form.getRawValue())
      .pipe(finalize(() => this.status.set('idle')))
      .subscribe({
        next: () => {
          this.form.markAsPristine();
          this.toastr.success('Recomendação nutricional salva.');
        },
      });
  }
}
