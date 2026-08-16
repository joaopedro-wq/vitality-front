import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BdBadgeComponent, BdButtonComponent, BdCardComponent } from 'bandeira-ui';

import {
  PlateLoaderComponent,
  type TamanhoPrato,
} from '../../components/atoms/plate-loader/plate-loader.component';
import { LoadingStateComponent } from '../../components/molecules/loading-state/loading-state.component';
import { PageTitleComponent } from '../../components/molecules/page-title/page-title.component';
import { ThemeService } from '../../core/layout/theme.service';

@Component({
  selector: 'vtp-ui-check',
  standalone: true,
  imports: [
    BdButtonComponent,
    BdCardComponent,
    BdBadgeComponent,
    PlateLoaderComponent,
    LoadingStateComponent,
    PageTitleComponent,
  ],
  template: `
    <div class="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <header class="flex items-center justify-between">
        <vtp-page-title contexto="Desenvolvimento" titulo="Vitality PLUS — UI check" />
        <button bdButton variant="ghost" (click)="theme.toggle()">Tema: {{ theme.theme() }}</button>
      </header>

      <bd-card interactive class="flex flex-col gap-4 p-6">
        <div class="flex items-center gap-2">
          <bd-badge tone="success">Meta batida</bd-badge>
          <bd-badge tone="warning">Perto do limite</bd-badge>
          <bd-badge tone="danger">Excedeu</bd-badge>
        </div>

        <p class="text-fg-muted">
          Se as cores acima refletem a paleta ativa e o botão muda de tema sem recarregar, tokens +
          Tailwind + bandeira-ui estão integrados.
        </p>

        <button bdButton>Botão primário</button>
      </bd-card>

      <bd-card class="flex flex-col gap-5 p-6">
        <h2 class="m-0 text-lg font-semibold text-fg">Prato Servindo — escalas</h2>

        <div class="flex flex-wrap items-end gap-8">
          @for (t of tamanhos; track t) {
            <div class="flex flex-col items-center gap-2">
              <vtp-plate-loader [tamanho]="t" />
              <span class="text-[11px] font-bold uppercase tracking-widest text-fg-subtle">
                {{ t }}
              </span>
            </div>
          }
        </div>

        <div class="flex flex-wrap items-center gap-4">
          <button bdButton [disabled]="true" [attr.aria-busy]="true">
            <vtp-plate-loader tamanho="xs" cor="herdada" /> Dentro de botão primary
          </button>
          <div class="rounded-[999px] bg-primary p-3 text-primary-contrast">
            <vtp-plate-loader tamanho="sm" cor="herdada" />
          </div>
        </div>

        <p class="m-0 text-[13px] text-fg-muted">
          Os dois últimos provam a herança de <code>currentColor</code>: sobre fundo
          <code>--bd-primary</code> o prato tem que continuar legível.
        </p>

        <vtp-loading-state
          titulo="Servindo o seu dia"
          descricao="Carregando metas, refeições e catálogo."
        />
      </bd-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiCheckComponent {
  protected readonly theme = inject(ThemeService);
  protected readonly tamanhos: TamanhoPrato[] = ['xs', 'sm', 'md', 'lg'];
}
