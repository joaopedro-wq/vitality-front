import { ChangeDetectionStrategy, Component } from '@angular/core';

import { BackButtonComponent } from '../../components/molecules/back-button/back-button.component';
import { PageTitleComponent } from '../../components/molecules/page-title/page-title.component';

@Component({
  selector: 'vtp-dashboard',
  standalone: true,
  imports: [BackButtonComponent, PageTitleComponent],
  template: `
    <vtp-back-button class="page-shell-wide" />
    <div class="page-shell-wide">
      <vtp-page-title titulo="Dashboard" subtitulo="Fase 6 do plano ainda não implementada." />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {}
