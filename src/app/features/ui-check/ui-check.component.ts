import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BdBadgeComponent, BdButtonComponent, BdCardComponent } from 'bandeira-ui';

import { ThemeService } from '../../core/layout/theme.service';

/**
 * Fase 0 do Plano B — valida que os tokens da paleta Vitality PLUS, o Tailwind
 * v4 e a bandeira-ui funcionam juntos, sem CSS ad-hoc, antes de qualquer HTTP.
 * Remover esta rota quando o dashboard real (Fase 6) estiver pronto.
 */
@Component({
  selector: 'vtp-ui-check',
  standalone: true,
  imports: [BdButtonComponent, BdCardComponent, BdBadgeComponent],
  template: `
    <div class="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <header class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold text-fg">Vitality PLUS — UI check</h1>
        <button bdButton variant="ghost" (click)="theme.toggle()">
          Tema: {{ theme.theme() }}
        </button>
      </header>

      <bd-card interactive class="flex flex-col gap-4 p-6">
        <div class="flex items-center gap-2">
          <bd-badge tone="success">Meta batida</bd-badge>
          <bd-badge tone="warning">Perto do limite</bd-badge>
          <bd-badge tone="danger">Excedeu</bd-badge>
        </div>

        <p class="text-fg-muted">
          Se as cores acima refletem a paleta ativa e o botão muda de
          tema sem recarregar, tokens + Tailwind + bandeira-ui estão integrados.
        </p>

        <button bdButton>Botão primário</button>
      </bd-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiCheckComponent {
  protected readonly theme = inject(ThemeService);
}
