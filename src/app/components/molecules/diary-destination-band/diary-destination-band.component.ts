import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  LucideApple,
  LucideArrowLeftRight,
  LucideDynamicIcon,
  LucideMoon,
  LucideSun,
  LucideSunrise,
  LucideUtensils,
  type LucideIcon,
} from '@lucide/angular';

import type { DiaryMeal } from '../../../core/models/diary.model';
import { momentoDaRefeicao, type MomentoRefeicao } from '../../utils/diary-day.util';

const ICONE_POR_MOMENTO: Record<MomentoRefeicao, LucideIcon> = {
  manha: LucideSunrise,
  almoco: LucideSun,
  lanche: LucideApple,
  jantar: LucideUtensils,
  ceia: LucideMoon,
};

/**
 * Faixa fixa dizendo em que refeição o registro vai cair.
 *
 * Existe para matar a pergunta duplicada: o destino já foi escolhido ao tocar a
 * fase no mapa, então ele vira estado visível e permanente, não uma etapa do
 * formulário. Trocar é exceção — fica atrás de um botão, e não custa um passo.
 */
@Component({
  selector: 'vtp-diary-destination-band',
  standalone: true,
  imports: [LucideDynamicIcon, LucideArrowLeftRight],
  templateUrl: './diary-destination-band.component.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiaryDestinationBandComponent {
  readonly meal = input.required<DiaryMeal>();
  readonly meals = input.required<DiaryMeal[]>();
  readonly aberto = input(false);

  readonly alternarTroca = output<void>();
  readonly selecionar = output<DiaryMeal>();

  protected readonly icone = computed(
    () => ICONE_POR_MOMENTO[momentoDaRefeicao(this.meal().descricao)],
  );

  protected iconeDe(meal: DiaryMeal): LucideIcon {
    return ICONE_POR_MOMENTO[momentoDaRefeicao(meal.descricao)];
  }
}
