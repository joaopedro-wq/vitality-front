import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BdButtonComponent, BdTooltipDirective } from 'bandeira-ui';
import { LucideArchive, LucidePencil, LucidePlus, LucideSparkles } from '@lucide/angular';
import { ToastrService } from 'ngx-toastr';
import { finalize, forkJoin } from 'rxjs';

import { BackButtonComponent } from '../../../components/molecules/back-button/back-button.component';
import { LoadingStateComponent } from '../../../components/molecules/loading-state/loading-state.component';
import { PageTitleComponent } from '../../../components/molecules/page-title/page-title.component';
import { gateCarregamento } from '../../../components/utils/loading-gate.util';
import { calcularProporcaoMacro } from '../../../components/utils/macro-percent.util';
import { MealPlanService } from '../../../services/meal-plan.service';
import { MetaService } from '../../../services/meta.service';
import type { MetaDiaria } from '../../../core/models/meta-diaria.model';
import type { MealPlan, MealPlanStyle } from '../../../core/models/meal-plan.model';

@Component({
  selector: 'vtp-dietas-list',
  standalone: true,
  imports: [
    DecimalPipe,
    BdButtonComponent,
    BdTooltipDirective,
    LucideArchive,
    LucidePencil,
    LucidePlus,
    LucideSparkles,
    BackButtonComponent,
    LoadingStateComponent,
    PageTitleComponent,
  ],
  templateUrl: './dietas-list.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DietasListComponent {
  private readonly plansService = inject(MealPlanService);
  private readonly metaService = inject(MetaService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  protected readonly loading = signal(true);
  protected readonly loadingVisivel = gateCarregamento(this.loading);
  protected readonly meta = signal<MetaDiaria | null>(null);
  protected readonly plans = signal<MealPlan[]>([]);

  protected readonly hasMeta = computed(() => this.meta() !== null);

  constructor() {
    this.load();
  }

  protected openGenerator(): void {
    if (!this.hasMeta()) {
      this.router.navigateByUrl('/metas');
      return;
    }
    this.router.navigateByUrl('/dietas/novo');
  }

  protected editPlan(plan: MealPlan): void {
    this.router.navigate(['/dietas/novo'], {
      queryParams: { planoId: plan.id, planoNome: plan.titulo },
    });
  }

  protected archive(plan: MealPlan): void {
    this.plansService.archive(plan.id).subscribe({
      next: () => {
        this.plans.update((plans) => plans.filter((item) => item.id !== plan.id));
        this.toastr.success('Plano arquivado.');
      },
      error: () => undefined,
    });
  }

  protected formatStyle(style: MealPlanStyle): string {
    return { rapido: 'Rápido', caseiro: 'Caseiro', economico: 'Econômico' }[style];
  }

  /** Anel do crachá: conic-gradient com a proporção real de proteína · carbo · gordura. */
  protected ringBackground(plan: MealPlan): string {
    const { proteina, carbo } = calcularProporcaoMacro(plan.totals);
    const p1 = Math.round(proteina);
    const p2 = Math.round(proteina + carbo);
    return `conic-gradient(var(--bd-primary) 0 ${p1}%, var(--bd-accent) ${p1}% ${p2}%, var(--fat) ${p2}% 100%)`;
  }

  private load(): void {
    forkJoin({
      metas: this.metaService.list(),
      plans: this.plansService.list(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ metas, plans }) => {
          this.meta.set(metas.find((item) => item.data === null) ?? metas[0] ?? null);
          this.plans.set(plans.filter((plan) => !plan.archived_at));
        },
        error: () => this.toastr.error('Não foi possível carregar seus planos agora.'),
      });
  }
}
