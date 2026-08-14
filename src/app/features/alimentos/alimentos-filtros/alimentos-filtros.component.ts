import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideX } from '@lucide/angular';

import {
  FacetCheckboxListComponent,
  type FacetOption,
} from '../../../components/molecules/facet-checkbox-list/facet-checkbox-list.component';
import { RangeSliderComponent } from '../../../components/molecules/range-slider/range-slider.component';
import type { AlimentoGrupo } from '../../../core/models/alimento.model';

@Component({
  selector: 'vtp-alimentos-filtros',
  standalone: true,
  imports: [FacetCheckboxListComponent, RangeSliderComponent, LucideX],
  templateUrl: './alimentos-filtros.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlimentosFiltrosComponent {
  readonly grupos = input.required<AlimentoGrupo[]>();
  readonly grupoSelecionado = input.required<string[]>();
  readonly grupoLoading = input(false);
  readonly caloriaRange = input.required<[number, number]>();
  readonly caloriaBounds = input<[number, number]>([0, 900]);

  readonly grupoSelecionadoChange = output<string[]>();
  readonly caloriaRangeChange = output<[number, number]>();
  readonly limpar = output<void>();

  protected readonly opcoesGrupo = computed<FacetOption[]>(() =>
    this.grupos().map((g) => ({ value: g.grupo, label: g.grupo, count: g.total })),
  );

  protected readonly temFiltroAtivo = computed(() => {
    const [min, max] = this.caloriaRange();
    const [boundMin, boundMax] = this.caloriaBounds();
    return this.grupoSelecionado().length > 0 || min !== boundMin || max !== boundMax;
  });

  protected formatKcal = (v: number): string => `${v} kcal`;
}
