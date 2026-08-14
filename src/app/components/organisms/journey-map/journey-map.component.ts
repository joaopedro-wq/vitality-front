import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  LucideApple,
  LucideCheck,
  LucideDynamicIcon,
  LucideFlag,
  LucideMoon,
  LucideSun,
  LucideSunrise,
  LucideUtensils,
  type LucideIcon,
} from '@lucide/angular';

import type { FaseDiario, MomentoRefeicao } from '../../utils/diary-day.util';
import { diaCompleto } from '../../utils/diary-day.util';
import { trilhaSerpentina } from '../../utils/journey-path.util';

const ICONE_POR_MOMENTO: Record<MomentoRefeicao, LucideIcon> = {
  manha: LucideSunrise,
  almoco: LucideSun,
  lanche: LucideApple,
  jantar: LucideUtensils,
  ceia: LucideMoon,
};

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

  readonly faseClick = output<number>();
  readonly bandeiraClick = output<void>();
  readonly carimboFim = output<void>();

  protected readonly trilha = computed(() => trilhaSerpentina(this.fases().length));
  protected readonly chegou = computed(() => diaCompleto(this.fases()));

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
