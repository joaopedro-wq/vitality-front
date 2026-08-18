import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { BdModalComponent } from 'bandeira-ui';
import { TranslocoPipe } from '@jsverse/transloco';
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

@Component({
  selector: 'vtp-diary-destination-band',
  standalone: true,
  imports: [BdModalComponent, TranslocoPipe, LucideDynamicIcon, LucideArrowLeftRight],
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

  /** `bd-modal` fecha sozinho no Esc/clique no fundo/X — `aberto` continua
   * sendo dono do pai (mesmo contrato de antes, quando era um bloco inline);
   * isso só repassa o fechamento pro `alternarTroca` que o pai já trata como
   * toggle. */
  protected onDialogChange(open: boolean): void {
    if (!open) this.alternarTroca.emit();
  }
}
