import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  LucideApple,
  LucideDynamicIcon,
  LucideEdit3,
  LucideFlag,
  LucideMoon,
  LucidePlus,
  LucideSun,
  LucideSunrise,
  LucideTrash2,
  LucideTrophy,
  LucideUtensils,
  type LucideIcon,
} from '@lucide/angular';

import { FoodIllustrationComponent } from '../../atoms/food-illustration/food-illustration.component';
import { PlateLoaderComponent } from '../../atoms/plate-loader/plate-loader.component';
import type { FaseDiario, FaseItem, MomentoRefeicao } from '../../utils/diary-day.util';
import { chaveDoItem } from '../../utils/diary-day.util';

const ICONE_POR_MOMENTO: Record<MomentoRefeicao, LucideIcon> = {
  manha: LucideSunrise,
  almoco: LucideSun,
  lanche: LucideApple,
  jantar: LucideUtensils,
  ceia: LucideMoon,
};

/**
 * Painel da fase selecionada no mapa: o que já foi registrado ali, os macros da
 * refeição e a única ação de registro daquele contexto. Mostra os alimentos
 * achatados (e não agrupados por lançamento) porque é assim que a pessoa pensa;
 * o `entryId` viaja dentro de cada item para as ações continuarem batendo com a
 * granularidade da API.
 */
@Component({
  selector: 'vtp-diary-phase-card',
  standalone: true,
  imports: [
    PlateLoaderComponent,
    DecimalPipe,
    FoodIllustrationComponent,
    LucideDynamicIcon,
    LucideEdit3,
    LucideFlag,
    LucidePlus,
    LucideTrash2,
  ],
  templateUrl: './diary-phase-card.component.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiaryPhaseCardComponent {
  readonly fase = input.required<FaseDiario>();
  readonly indice = input(0);
  readonly totalFases = input(0);
  readonly fasesRestantes = input(0);
  readonly mensagemVazia = input('Fase em aberto.');
  /** Confirmação leve do que acabou de ser gravado; some na próxima interação. */
  readonly flash = input<string | null>(null);
  /** Chave do item em remoção — trava só o botão dele, não a lista inteira. */
  readonly removendo = input<string | null>(null);

  readonly adicionar = output<void>();
  readonly removerItem = output<FaseItem>();
  readonly editarLancamento = output<number>();

  protected readonly chaveDoItem = chaveDoItem;

  protected readonly icone = computed(() => ICONE_POR_MOMENTO[this.fase().momento]);
  protected readonly iconeRecompensa = computed(() =>
    this.fasesRestantes() === 0 ? LucideTrophy : LucideFlag,
  );
  protected readonly concluida = computed(() => this.fase().itens.length > 0);
  protected readonly rotuloEstado = computed(() => {
    const estado = this.fase().estado;
    if (estado === 'concluida') return 'concluída';
    return estado === 'atual' ? 'fase atual' : 'aberta';
  });
}
