import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { BdSettingsSection, BdSettingsTemplateComponent } from 'bandeira-ui';

import { RecomendacaoFormComponent } from '../../recomendacao/recomendacao-page/recomendacao-form.component';
import { MetaFormComponent } from './meta-form.component';

const SECTIONS: BdSettingsSection[] = [
  { id: 'recomendacao', label: 'Recomendação nutricional', hint: 'TMB, GET e macros sugeridos' },
  { id: 'metas', label: 'Metas diárias', hint: 'O que vale como meta no dashboard' },
];

/** Fase 3 do Plano B — base numérica consumida pelo Dashboard (Fase 6) e Diário (Fase 5). */
@Component({
  selector: 'vtp-metas-page',
  standalone: true,
  imports: [BdSettingsTemplateComponent, RecomendacaoFormComponent, MetaFormComponent],
  templateUrl: './metas-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetasPageComponent {
  protected readonly sections = SECTIONS;
  protected readonly activeSection = signal('recomendacao');
}
