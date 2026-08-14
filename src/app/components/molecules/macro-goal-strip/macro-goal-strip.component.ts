import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { DiaryMacros } from '../../../core/models/diary.model';
import type { MetaDiaria } from '../../../core/models/meta-diaria.model';

interface MacroMedidor {
  label: string;
  valor: number;
  alvo: number | null;
  cor: string;
  progresso: number;
}

@Component({
  selector: 'vtp-macro-goal-strip',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './macro-goal-strip.component.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MacroGoalStripComponent {
  readonly totals = input.required<DiaryMacros>();
  readonly meta = input<MetaDiaria | null>(null);

  protected readonly progressoCalorias = computed(() =>
    this.proporcao(this.totals().caloria, this.meta()?.meta_calorias ?? null),
  );

  protected readonly restante = computed(() => {
    const alvo = this.meta()?.meta_calorias;
    if (!alvo) return null;
    return alvo - this.totals().caloria;
  });

  protected readonly medidores = computed<MacroMedidor[]>(() => {
    const totais = this.totals();
    const meta = this.meta();
    return [
      {
        label: 'Proteína',
        valor: totais.proteina,
        alvo: meta?.meta_proteinas ?? null,
        cor: 'var(--bd-primary)',
        progresso: this.proporcao(totais.proteina, meta?.meta_proteinas ?? null),
      },
      {
        label: 'Carboidrato',
        valor: totais.carbo,
        alvo: meta?.meta_carboidratos ?? null,
        cor: 'var(--bd-accent)',
        progresso: this.proporcao(totais.carbo, meta?.meta_carboidratos ?? null),
      },
      {
        label: 'Gordura',
        valor: totais.gordura,
        alvo: meta?.meta_gorduras ?? null,
        cor: 'var(--fat)',
        progresso: this.proporcao(totais.gordura, meta?.meta_gorduras ?? null),
      },
    ];
  });

  protected absoluto(valor: number): number {
    return Math.abs(valor);
  }

  /** Sem meta definida o medidor não tem denominador — devolve 0 em vez de
   * dividir por zero e desenhar uma barra cheia mentirosa. */
  private proporcao(valor: number, alvo: number | null): number {
    if (!alvo || alvo <= 0) return 0;
    return Math.min((valor / alvo) * 100, 100);
  }
}
