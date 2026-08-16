import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { LoadingStateComponent } from '../../molecules/loading-state/loading-state.component';

/**
 * Espera longa que bloqueia a tela — gerar plano de dieta, reimportar TACO.
 *
 * Compõe o `vtp-loading-state` em vez de redesenhar o prato: o conteúdo é o
 * mesmo, só muda o enquadramento (scrim + card centralizado). Não é dismissível
 * e não tem ação, por isso `role="status"` e não `alertdialog` — quem anuncia
 * continua sendo o `loading-state` lá dentro.
 *
 * Só renderiza quando `ativo`, e quem passa esse booleano deve usar o signal
 * cru: a ação já é longa o bastante pra não precisar de anti-flicker, e travar
 * a tela por 400ms extras seria pior que o flash.
 */
@Component({
  selector: 'vtp-loading-overlay',
  standalone: true,
  imports: [LoadingStateComponent],
  templateUrl: './loading-overlay.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingOverlayComponent {
  readonly ativo = input(false);
  readonly titulo = input('Trabalhando nisso…');
  readonly descricao = input<string | undefined>(undefined);
}
