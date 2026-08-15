import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideCheck, LucideDynamicIcon, LucideFlag, type LucideIcon } from '@lucide/angular';

import type { FaseDiario } from '../../utils/diary-day.util';
import { ICONE_POR_MOMENTO, diaCompleto } from '../../utils/diary-day.util';
import { trilhaSerpentina } from '../../utils/journey-path.util';

interface NoTrilha {
  fase: FaseDiario;
  indice: number;
  x: number;
  y: number;
  icone: LucideIcon;
  concluida: boolean;
  atual: boolean;
  selecionada: boolean;
  balanca: boolean;
  pulsa: boolean;
  carimba: boolean;
  sombra: string;
  classesDisco: string;
}

/**
 * O dia como um caminho: uma fase por refeição, ligadas por uma trilha que fica
 * sólida conforme você anda, e uma bandeira no fim. Substitui a lista/abas de
 * refeições — o objetivo é responder "onde estou no meu dia?" de relance, e dar
 * um destino inequívoco para cada registro.
 *
 * Presentation-only: recebe as fases prontas (`montarFases`) e só emite cliques.
 */
@Component({
  selector: 'vtp-journey-map',
  standalone: true,
  // LucideCheck não entra aqui: é usado como dado em `[lucideIcon]`, não como
  // diretiva no template — quem resolve isso é o LucideDynamicIcon.
  imports: [DecimalPipe, LucideDynamicIcon, LucideFlag],
  templateUrl: './journey-map.component.html',
  styleUrl: './journey-map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JourneyMapComponent {
  readonly fases = input.required<FaseDiario[]>();
  readonly selecionada = input(0);
  /** Fase que está sendo preenchida agora — ganha um anel pulsando, para o mapa
   * continuar dizendo onde o registro vai cair enquanto o composer está aberto. */
  readonly preenchendo = input(false);
  /** `mealId` que acabou de receber lançamento; dispara a animação de carimbo. */
  readonly carimbo = input<number | null>(null);
  readonly dica = input('');
  /** % da meta calórica (0–100), já calculado por quem monta a tela — vira o
   * anel em volta da bandeira. `null` quando não há meta definida ainda. */
  readonly progresso = input<number | null>(null);
  /** Legenda curta sob "Fim do dia" (ex.: "1.240 / 2.100 kcal"). `null` some. */
  readonly resumoBandeira = input<string | null>(null);

  readonly faseClick = output<number>();
  readonly bandeiraClick = output<void>();
  readonly carimboFim = output<void>();

  protected readonly trilha = computed(() => trilhaSerpentina(this.fases().length));
  protected readonly chegou = computed(() => diaCompleto(this.fases()));

  /** `conic-gradient` do anel da bandeira — só existe enquanto há `progresso`
   * pra mostrar; sem meta definida a bandeira volta ao estado tracejado
   * simples de antes, sem anel nenhum. */
  protected readonly anelBandeira = computed(() => {
    const pct = this.progresso();
    if (pct === null) return null;
    const clamped = Math.min(100, Math.max(0, pct));
    return `conic-gradient(var(--bd-primary) ${clamped}%, var(--bd-border) 0)`;
  });

  protected readonly nos = computed<NoTrilha[]>(() => {
    const nodes = this.trilha().nodes;
    const selecionada = this.selecionada();
    const carimbo = this.carimbo();
    const preenchendo = this.preenchendo();

    return this.fases().map((fase, indice) => {
      const concluida = fase.estado === 'concluida';
      const atual = fase.estado === 'atual';
      const estaSelecionada = indice === selecionada;

      return {
        fase,
        indice,
        x: nodes[indice]?.x ?? 50,
        y: nodes[indice]?.y ?? 50,
        icone: concluida ? LucideCheck : ICONE_POR_MOMENTO[fase.momento],
        concluida,
        atual,
        selecionada: estaSelecionada,
        balanca: atual && !preenchendo,
        pulsa: preenchendo && estaSelecionada,
        carimba: fase.mealId === carimbo,
        sombra: this.sombra(concluida, atual, estaSelecionada),
        classesDisco: this.classesDisco(concluida, atual),
      };
    });
  });

  /** Um segmento é "andado" quando a fase que ele parte já tem lançamento. */
  protected andou(indice: number): boolean {
    return this.fases()[indice]?.estado === 'concluida';
  }

  protected aoTerminarAnimacao(evento: AnimationEvent): void {
    if (evento.animationName === 'vtp-stamp') this.carimboFim.emit();
  }

  protected legenda(fase: FaseDiario): string | null {
    if (fase.estado === 'concluida') return null;
    return fase.estado === 'atual' ? 'fase atual' : 'aberta';
  }

  /**
   * A sombra inferior de 4px é o que dá o volume de "ficha de jogo" ao disco, e
   * o anel marca a seleção. Montada aqui, e não em classe, porque as duas se
   * somam numa única propriedade `box-shadow`.
   */
  private sombra(concluida: boolean, atual: boolean, selecionada: boolean): string {
    const base = concluida
      ? '0 4px 0 0 var(--bd-primary-strong)'
      : atual
        ? '0 4px 0 0 color-mix(in oklab, var(--bd-accent), black 22%)'
        : '0 4px 0 0 var(--bd-border-strong)';

    if (!selecionada) return base;
    return `${base}, 0 0 0 5px ${atual ? 'var(--bd-accent-soft)' : 'var(--bd-primary-soft)'}`;
  }

  private classesDisco(concluida: boolean, atual: boolean): string {
    if (concluida) return 'border-primary bg-primary text-primary-contrast';
    if (atual) return 'border-accent bg-accent text-[#2b2417]';
    return 'border-border-strong bg-surface text-fg-subtle';
  }
}
