import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type TamanhoAnel = 'sm' | 'md' | 'lg';

const TAMANHOS: Record<TamanhoAnel, number> = { sm: 40, md: 52, lg: 104 };

@Component({
  selector: 'vtp-progress-ring-icon',
  standalone: true,
  templateUrl: './progress-ring-icon.component.html',
  host: {
    class:
      'relative inline-grid shrink-0 place-items-center rounded-full transition-[background,box-shadow] duration-[400ms]',
    '[style.width.px]': 'px()',
    '[style.height.px]': 'px()',
    '[style.background]': 'fundo()',
    '[style.border]': 'borda()',
    '[style.boxShadow]': 'halo()',
    '[style.color]': 'corIcone()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressRingIconComponent {
  readonly progresso = input<number | null>(null);

  readonly corVar = input<string>('--bd-primary');

  readonly tamanho = input<TamanhoAnel>('md');

  readonly ativo = input(false, { transform: booleanAttribute });

  protected readonly px = computed(() => TAMANHOS[this.tamanho()]);

  protected readonly fundo = computed(() => {
    const progresso = this.progresso();
    if (progresso === null) return 'var(--bd-surface)';
    const clamped = Math.min(100, Math.max(0, progresso));
    // Camada radial "recorta" um miolo na cor da superfície — sem ela o conic-gradient pintaria
    // um disco cheio (pizza), não um anel oco em volta do ícone.
    return (
      'radial-gradient(closest-side, var(--bd-surface) 72%, transparent 73%), ' +
      `conic-gradient(var(${this.corVar()}) ${clamped}%, var(--bd-border) 0)`
    );
  });

  protected readonly borda = computed(() =>
    this.progresso() === null ? '1.5px solid var(--bd-border-strong)' : 'none',
  );

  protected readonly corIcone = computed(() =>
    this.progresso() === null ? 'var(--bd-fg-muted)' : `var(${this.corVar()})`,
  );

  protected readonly halo = computed(() =>
    this.ativo() ? `0 0 0 4px var(${this.corVar()}-soft)` : 'none',
  );
}
