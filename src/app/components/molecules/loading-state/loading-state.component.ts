import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { LanguageService } from '../../../core/i18n/language.service';

import { PlateLoaderComponent } from '../../atoms/plate-loader/plate-loader.component';

/**
 * Bloco de espera de uma tela ou seção: prato + título + descrição.
 *
 * Presentation-only de propósito — o anti-flicker fica em `gateCarregamento`
 * (`components/utils/loading-gate.util.ts`), porque quem decide renderizar isto
 * ou o conteúdo é o template do pai. Usar sempre com o signal gateado:
 * `@if (carregandoVisivel()) { <vtp-loading-state … /> } @else { … }`.
 *
 * É o único dono de `role="status"` do sistema — o `vtp-plate-loader` entra mudo
 * aqui dentro. Nunca aninhar dois `role="status"`.
 */
@Component({
  selector: 'vtp-loading-state',
  standalone: true,
  imports: [PlateLoaderComponent],
  templateUrl: './loading-state.component.html',
  host: {
    class: 'block',
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingStateComponent {
  private readonly language = inject(LanguageService);
  private readonly transloco = inject(TranslocoService);
  readonly titulo = input<string | undefined>(undefined);
  protected readonly tituloResolvido = computed(() => {
    if (this.titulo()) return this.titulo()!;
    this.language.locale();
    return this.transloco.translate('common.actions.loading');
  });
  readonly descricao = input<string | undefined>(undefined);
  readonly tamanho = input<'sm' | 'md'>('md');
}
