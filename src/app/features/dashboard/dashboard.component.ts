import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PageTitleComponent } from '../../components/molecules/page-title/page-title.component';

/** Placeholder de rota — implementação completa é a Fase 6 do Plano B (CLAUDE.md). */
@Component({
  selector: 'vtp-dashboard',
  standalone: true,
  imports: [PageTitleComponent],
  template: `
    <vtp-page-title titulo="Dashboard" subtitulo="Fase 6 do plano ainda não implementada." />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {}
