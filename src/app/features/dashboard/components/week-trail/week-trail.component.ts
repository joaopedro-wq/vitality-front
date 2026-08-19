import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { LanguageService } from '../../../../core/i18n/language.service';
import type { DashboardSemanaDia } from '../../../../core/models/dashboard.model';

interface DiaTrilha extends DashboardSemanaDia {
  rotulo: string;
  hoje: boolean;
}

@Component({
  selector: 'vtp-week-trail',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './week-trail.component.html',
  host: { class: 'card animate-reveal p-5' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekTrailComponent {
  private readonly language = inject(LanguageService);

  readonly dias = input<DashboardSemanaDia[]>([]);

  readonly hoje = input<string | null>(null);

  protected readonly diasComRotulo = computed<DiaTrilha[]>(() => {
    const locale = this.language.locale();
    const hojeIso = this.hoje();
    const formatador = new Intl.DateTimeFormat(locale, { weekday: 'short' });

    return this.dias().map((dia) => ({
      ...dia,
      hoje: dia.data === hojeIso,
      rotulo: formatador.format(new Date(`${dia.data}T12:00:00`)).replace('.', ''),
    }));
  });
}
