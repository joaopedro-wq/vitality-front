import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { LanguageService } from '../../../../core/i18n/language.service';
import type { DashboardSemanaDia } from '../../../../core/models/dashboard.model';

type EstadoDia = 'done' | 'today' | 'pending';

interface DiaTrilha extends DashboardSemanaDia {
  rotulo: string;
  hoje: boolean;
  estado: EstadoDia;
}

@Component({
  selector: 'vtp-week-trail',
  standalone: true,
  imports: [TranslocoPipe, DecimalPipe],
  templateUrl: './week-trail.component.html',
  host: { class: 'card animate-reveal p-4' },
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

    return this.dias().map((dia) => {
      const ehHoje = dia.data === hojeIso;

      return {
        ...dia,
        hoje: ehHoje,
        rotulo: formatador.format(new Date(`${dia.data}T12:00:00`)).replace('.', ''),
        estado: dia.dentro_da_meta ? 'done' : ehHoje ? 'today' : 'pending',
      };
    });
  });

  protected readonly diasDentroDaMeta = computed(
    () => this.dias().filter((dia) => dia.dentro_da_meta).length,
  );

  protected readonly totalDias = computed(() => this.dias().length);

  protected classesDoPill(estado: EstadoDia): string {
    switch (estado) {
      case 'done':
        return 'bg-primary text-primary-contrast';
      case 'today':
        return 'bg-accent text-primary-contrast';
      default:
        return 'bg-border text-fg-subtle';
    }
  }
}
