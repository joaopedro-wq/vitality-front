import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BdButtonComponent } from 'bandeira-ui';
import { LucidePlus, LucideSparkles } from '@lucide/angular';
import { ToastrService } from 'ngx-toastr';
import { finalize, forkJoin } from 'rxjs';

import { BackButtonComponent } from '../../../components/molecules/back-button/back-button.component';
import { LoadingStateComponent } from '../../../components/molecules/loading-state/loading-state.component';
import { PageTitleComponent } from '../../../components/molecules/page-title/page-title.component';
import { gateCarregamento } from '../../../components/utils/loading-gate.util';
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
