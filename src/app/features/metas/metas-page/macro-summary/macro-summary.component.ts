import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface MacroValores {
  caloria: number;
  proteina: number;
  carbo: number;
  gordura: number;
}

/**
 * Anel de calorias + chips de macro (proteína/carbo/gordura), em dois
 * tamanhos. Usado na tira do quiz, no painel do estado "configurado" e no
 * passo de sugestão — um componente só, pra layout ficar uniforme por
 * construção em vez de cada tela desenhar o próprio anel "parecido".
 *
 * Cores seguem o mapeamento documentado no CLAUDE.md: proteína = --bd-primary,
 * carbo = --bd-accent, gordura = --fat (definida no :host do metas-page).
 */
@Component({
  selector: 'vtp-macro-summary',
  standalone: true,
  templateUrl: './macro-summary.component.html',
  styleUrl: './macro-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MacroSummaryComponent {
  readonly valores = input<MacroValores | null>(null);
  readonly tamanho = input<'sm' | 'lg'>('sm');
  /** Fração do anel preenchida (0–1) — decorativa, não representa consumo real ainda (Fase 5/6). */
  readonly progresso = input(0.7);

  protected readonly raio = computed(() => (this.tamanho() === 'lg' ? 48 : 25));
  protected readonly espessura = computed(() => (this.tamanho() === 'lg' ? 11 : 8));
  protected readonly viewBox = computed(() => {
    const r = this.raio();
    const e = this.espessura();
    const size = r * 2 + e;
    return `0 0 ${size} ${size}`;
  });
  protected readonly centro = computed(() => this.raio() + this.espessura() / 2);
  protected readonly circunferencia = computed(() => 2 * Math.PI * this.raio());
  protected readonly dashoffset = computed(() => this.circunferencia() * (1 - this.progresso()));
}
