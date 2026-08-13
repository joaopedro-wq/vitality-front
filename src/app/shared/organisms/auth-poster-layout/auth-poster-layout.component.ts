import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Chrome visual "Feira Vitality" (pôster de feira livre) para as telas de
 * auth — bloco diagonal manga/ameixa, cartão creme, badge girado.
 *
 * Sobrescreve os tokens `--bd-*` só dentro do próprio host (custom properties
 * herdam pela árvore do DOM independente de view encapsulation), então os
 * componentes da bandeira-ui projetados aqui dentro (bd-field, bdInput,
 * bdButton) saem retemados sem mexer no tema global do app — o dashboard
 * autenticado continua verde-menta/laranja.
 */
@Component({
  selector: 'vtp-auth-poster-layout',
  standalone: true,
  templateUrl: './auth-poster-layout.component.html',
  styleUrl: './auth-poster-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPosterLayoutComponent {
  readonly badge = input<string>('');
}
