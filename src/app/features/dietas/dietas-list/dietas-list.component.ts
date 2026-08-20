import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { BdButtonComponent, BdTooltipDirective } from 'bandeira-ui';
import {
  LucideArchive,
  LucidePencil,
  LucidePlus,
  LucideSparkles,
  LucideStar,
  LucideTrash2,
} from '@lucide/angular';
import { ToastrService } from 'ngx-toastr';
import { Subject, finalize, forkJoin, takeUntil } from 'rxjs';

import { BackButtonComponent } from '../../../components/molecules/back-button/back-button.component';
import { ConfirmDialogComponent } from '../../../components/molecules/confirm-dialog/confirm-dialog.component';
import { LoadingStateComponent } from '../../../components/molecules/loading-state/loading-state.component';
import {
  ModeChoiceDialogComponent,
  type ModoGeracaoPlano,
} from '../../../components/molecules/mode-choice-dialog/mode-choice-dialog.component';
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
    TranslocoPipe,
    BdButtonComponent,
    BdTooltipDirective,
    LucideArchive,
    LucidePencil,
    LucidePlus,
    LucideSparkles,
    LucideStar,
    LucideTrash2,
    BackButtonComponent,
    ConfirmDialogComponent,
    ModeChoiceDialogComponent,
    LoadingStateComponent,
    PageTitleComponent,
  ],
  templateUrl: './dietas-list.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DietasListComponent implements OnDestroy {
  private readonly plansService = inject(MealPlanService);
  private readonly metaService = inject(MetaService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);
  private readonly transloco = inject(TranslocoService);
  /** Regra do sistema (ver CLAUDE.md, "Stack"): toda subscription de API é
   * encerrada ao sair do componente — `takeUntil(this.destruido)`. */
  private readonly destruido = new Subject<void>();

  protected readonly loading = signal(true);
  protected readonly loadingVisivel = gateCarregamento(this.loading);
  protected readonly meta = signal<MetaDiaria | null>(null);
  protected readonly plans = signal<MealPlan[]>([]);
  protected readonly removendo = signal<number | null>(null);
  protected readonly favoritando = signal<number | null>(null);
  protected readonly confirmacao = signal<{
    acao: 'arquivar' | 'excluir';
    plano: MealPlan;
  } | null>(null);

  protected readonly hasMeta = computed(() => this.meta() !== null);
  protected readonly modalModoAberto = signal(false);

  constructor() {
    this.load();
  }

  ngOnDestroy(): void {
    this.destruido.next();
    this.destruido.complete();
  }

  protected openGenerator(): void {
    if (!this.hasMeta()) {
      this.router.navigateByUrl('/metas');
      return;
    }
    this.modalModoAberto.set(true);
  }

  protected onModoEscolhido(modo: ModoGeracaoPlano): void {
    this.modalModoAberto.set(false);
    if (modo === 'manual') {
      this.router.navigateByUrl('/dietas/novo/manual');
      return;
    }
    this.router.navigateByUrl('/dietas/novo');
  }

  protected fecharModalModo(): void {
    this.modalModoAberto.set(false);
  }

  protected editPlan(plan: MealPlan): void {
    const rota = plan.source === 'manual' ? '/dietas/novo/manual' : '/dietas/novo';
    this.router.navigate([rota], {
      queryParams: { planoId: plan.id, planoNome: plan.titulo },
    });
  }

  protected solicitarArquivamento(plan: MealPlan): void {
    this.confirmacao.set({ acao: 'arquivar', plano: plan });
  }

  protected solicitarExclusao(plan: MealPlan): void {
    if (this.removendo() !== null) return;
    this.confirmacao.set({ acao: 'excluir', plano: plan });
  }

  protected confirmarAcao(): void {
    const confirmacao = this.confirmacao();
    this.confirmacao.set(null);
    if (!confirmacao) return;

    if (confirmacao.acao === 'arquivar') {
      this.arquivar(confirmacao.plano);
    } else {
      this.excluir(confirmacao.plano);
    }
  }

  protected fecharConfirmacao(): void {
    this.confirmacao.set(null);
  }

  /** Não destrutivo (sem confirm-dialog) — só um favorito por vez, o backend já desfavorita
   * qualquer outro plano do usuário ao marcar este (ver `MealPlanController::favorite`). É o
   * plano que o Painel usa como "plano ativo" (`DashboardService::resolverPlano`). */
  protected favoritar(plan: MealPlan): void {
    if (this.favoritando() !== null) return;
    this.favoritando.set(plan.id);

    const favoritadoAgora = !plan.favorited_at;
    const aoConcluir = (): void => {
      this.plans.update((plans) =>
        plans.map((item) => ({
          ...item,
          favorited_at:
            item.id === plan.id
              ? favoritadoAgora
                ? new Date().toISOString()
                : null
              : favoritadoAgora
                ? null
                : item.favorited_at,
        })),
      );
      this.toastr.success(
        this.transloco.translate(
          favoritadoAgora ? 'dietPlan.toast.favorited' : 'dietPlan.toast.unfavorited',
        ),
      );
    };
    const aoFalhar = (): void => {
      this.toastr.error(this.transloco.translate('dietPlan.toast.favoriteError'));
    };

    if (plan.favorited_at) {
      this.plansService
        .unfavorite(plan.id)
        .pipe(
          finalize(() => this.favoritando.set(null)),
          takeUntil(this.destruido),
        )
        .subscribe({ next: aoConcluir, error: aoFalhar });
    } else {
      this.plansService
        .favorite(plan.id)
        .pipe(
          finalize(() => this.favoritando.set(null)),
          takeUntil(this.destruido),
        )
        .subscribe({ next: aoConcluir, error: aoFalhar });
    }
  }

  private arquivar(plan: MealPlan): void {
    this.plansService
      .archive(plan.id)
      .pipe(takeUntil(this.destruido))
      .subscribe({
        next: () => {
          this.plans.update((plans) => plans.filter((item) => item.id !== plan.id));
          this.toastr.success(this.transloco.translate('dietPlan.toast.archived'));
        },
        error: () => undefined,
      });
  }

  private excluir(plan: MealPlan): void {
    if (this.removendo() !== null) return;
    this.removendo.set(plan.id);
    this.plansService
      .remove(plan.id)
      .pipe(
        finalize(() => this.removendo.set(null)),
        takeUntil(this.destruido),
      )
      .subscribe({
        next: () => {
          this.plans.update((plans) => plans.filter((item) => item.id !== plan.id));
          this.toastr.success(this.transloco.translate('dietPlan.toast.deleted'));
        },
        error: () => this.toastr.error(this.transloco.translate('dietPlan.toast.deleteError')),
      });
  }

  protected readonly varianteConfirmacao = computed(() =>
    this.confirmacao()?.acao === 'excluir' ? 'danger' : 'soft',
  );

  protected readonly tituloConfirmacao = computed(() =>
    this.confirmacao()?.acao === 'excluir'
      ? 'dietPlan.confirm.deleteTitle'
      : 'dietPlan.confirm.archiveTitle',
  );

  protected readonly descricaoConfirmacao = computed(() =>
    this.confirmacao()?.acao === 'excluir'
      ? 'dietPlan.confirm.deleteDescription'
      : 'dietPlan.confirm.archiveDescription',
  );

  protected readonly textoConfirmacao = computed(() =>
    this.confirmacao()?.acao === 'excluir'
      ? 'dietPlan.confirm.deleteAction'
      : 'dietPlan.confirm.archiveAction',
  );

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
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntil(this.destruido),
      )
      .subscribe({
        next: ({ metas, plans }) => {
          this.meta.set(metas.find((item) => item.data === null) ?? metas[0] ?? null);
          this.plans.set(plans.filter((plan) => !plan.archived_at));
        },
        error: () => this.toastr.error('Não foi possível carregar seus planos agora.'),
      });
  }
}
