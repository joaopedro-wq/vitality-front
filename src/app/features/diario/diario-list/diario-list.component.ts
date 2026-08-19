import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideArrowLeft, LucideArrowRight, LucideSettings2 } from '@lucide/angular';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ToastrService } from 'ngx-toastr';
import { Subject, finalize, forkJoin, takeUntil, type Observable } from 'rxjs';

import { LanguageService } from '../../../core/i18n/language.service';

import { MacroGoalStripComponent } from '../../../components/molecules/macro-goal-strip/macro-goal-strip.component';
import { OverflowMenuComponent } from '../../../components/molecules/overflow-menu/overflow-menu.component';
import { JourneyMapComponent } from '../../../components/organisms/journey-map/journey-map.component';
import { DayRevealOverlayComponent } from '../../../components/organisms/day-reveal-overlay/day-reveal-overlay.component';
import { DiaryPhaseCardComponent } from '../../../components/molecules/diary-phase-card/diary-phase-card.component';
import {
  chaveDoItem,
  montarFases,
  payloadSemItem,
  proximaFaseAberta,
  type FaseDiario,
  type FaseItem,
} from '../../../components/utils/diary-day.util';
import type {
  DiaryDay,
  DiaryEntry,
  DiaryMacros,
  DiaryMeal,
} from '../../../core/models/diary.model';
import type { MetaDiaria } from '../../../core/models/meta-diaria.model';
import { DiarioService } from '../../../services/diario.service';
import { MetaService } from '../../../services/meta.service';
import { EntryComposerComponent } from '../entry-composer/entry-composer.component';
import { MealManagerComponent } from '../meal-manager/meal-manager.component';
import { BackButtonComponent } from '../../../components/molecules/back-button/back-button.component';
import { LoadingStateComponent } from '../../../components/molecules/loading-state/loading-state.component';
import { PageTitleComponent } from '../../../components/molecules/page-title/page-title.component';
import { gateCarregamento } from '../../../components/utils/loading-gate.util';

const EMPTY_TOTALS: DiaryMacros = { caloria: 0, proteina: 0, carbo: 0, gordura: 0, quantidade: 0 };

type Modo = 'cartao' | 'compor';

@Component({
  selector: 'vtp-diario-list',
  standalone: true,
  imports: [
    TranslocoPipe,
    MacroGoalStripComponent,
    OverflowMenuComponent,
    JourneyMapComponent,
    DiaryPhaseCardComponent,
    DayRevealOverlayComponent,
    EntryComposerComponent,
    MealManagerComponent,
    LucideArrowLeft,
    LucideArrowRight,
    LucideSettings2,
    BackButtonComponent,
    LoadingStateComponent,
    PageTitleComponent,
  ],
  templateUrl: './diario-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiarioListComponent implements OnDestroy {
  private readonly diaryService = inject(DiarioService);
  private readonly metaService = inject(MetaService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);
  private readonly language = inject(LanguageService);
  private readonly transloco = inject(TranslocoService);
  private readonly destruido = new Subject<void>();

  protected readonly today = this.dateString(new Date());
  protected readonly selectedDate = signal(this.today);
  protected readonly day = signal<DiaryDay | null>(null);
  protected readonly meals = signal<DiaryMeal[]>([]);
  protected readonly meta = signal<MetaDiaria | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadingVisivel = gateCarregamento(this.loading);
  protected readonly managerOpen = signal(false);
  protected readonly menuAberto = signal(false);
  protected readonly revelacaoAberta = signal(false);
  protected readonly faseMobileAberta = signal(false);

  protected readonly modo = signal<Modo>('cartao');
  protected readonly faseSelecionada = signal(0);
  protected readonly entryEmEdicao = signal<DiaryEntry | null>(null);
  protected readonly carimbo = signal<number | null>(null);
  protected readonly flash = signal<string | null>(null);
  protected readonly removendo = signal<string | null>(null);
  private pendingPlanMeal: number | null = null;

  protected readonly totals = computed(() => this.day()?.totals ?? EMPTY_TOTALS);
  protected readonly fases = computed(() => montarFases(this.day(), this.meals()));
  protected readonly faseAtual = computed<FaseDiario | null>(
    () => this.fases()[this.faseSelecionada()] ?? null,
  );
  protected readonly mealAtual = computed<DiaryMeal | null>(() => {
    const fase = this.faseAtual();
    return fase ? (this.meals().find((meal) => meal.id === fase.mealId) ?? null) : null;
  });
  protected readonly fasesRestantes = computed(
    () => this.fases().filter((fase) => fase.estado !== 'concluida').length,
  );
  protected readonly mensagemVazia = computed(() => {
    const locale = this.language.locale();
    const alvo = this.meta()?.meta_calorias;
    const restante = alvo ? alvo - this.totals().caloria : null;
    if (restante !== null && restante > 0) {
      return this.transloco.translate('diaryPage.emptyPhaseWithBudget', {
        kcal: Math.round(restante).toLocaleString(locale),
      });
    }
    return this.transloco.translate('diaryPage.emptyPhaseNoBudget');
  });
  /** Mesma fórmula do `day-reveal-overlay` — vira o anel de progresso em volta
   * da bandeira do mapa, pra não exigir o clique nela pra ver como o dia está. */
  protected readonly progressoMeta = computed(() => {
    const alvo = this.meta()?.meta_calorias;
    if (!alvo || alvo <= 0) return null;
    return Math.round((this.totals().caloria / alvo) * 100);
  });

  /** Legenda curta sob a bandeira — só aparece quando há algo pra contar
   * (consumo registrado ou meta definida), pra não poluir um dia zerado. */
  protected readonly resumoBandeira = computed(() => {
    const locale = this.language.locale();
    const kcalLabel = this.transloco.translate('nutrition.kcal');
    const consumido = Math.round(this.totals().caloria);
    const alvo = this.meta()?.meta_calorias;
    if (!alvo) return consumido > 0 ? `${consumido.toLocaleString(locale)} ${kcalLabel}` : null;
    return `${consumido.toLocaleString(locale)} / ${Math.round(alvo).toLocaleString(locale)} ${kcalLabel}`;
  });

  protected readonly canGoNext = computed(() => this.selectedDate() < this.today);
  protected readonly dateLabel = computed(() => {
    const locale = this.language.locale();
    const date = new Date(`${this.selectedDate()}T12:00:00`);
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);
  });

  /** `effect()` roda uma vez na inicialização — a primeira carga já é disparada pelo `load()`
   * logo abaixo, então esse disparo inicial só marca a flag (mesmo padrão de
   * `AlimentosListComponent`). */
  private idiomaInicializado = false;

  constructor() {
    this.load();
    this.route.queryParamMap.pipe(takeUntil(this.destruido)).subscribe((params) => {
      if (params.get('registrar') !== '1') return;
      const planMeal = Number(params.get('planMeal'));
      this.pendingPlanMeal = Number.isInteger(planMeal) && planMeal >= 0 ? planMeal : null;
      this.abrirSolicitado();
    });

    effect(() => {
      this.language.locale();
      if (!this.idiomaInicializado) {
        this.idiomaInicializado = true;

        return;
      }
      // Nome de refeição/alimento no dia já carregado vem do backend no idioma da busca
      // original — sem recarregar, trocar de idioma não retraduz o que já está na tela.
      untracked(() => this.load());
    });
  }

  ngOnDestroy(): void {
    this.destruido.next();
    this.destruido.complete();
  }

  protected previousDay(): void {
    this.changeDay(-1);
  }

  protected nextDay(): void {
    if (this.canGoNext()) this.changeDay(1);
  }

  protected goToday(): void {
    if (this.selectedDate() === this.today) return;
    this.selectedDate.set(this.today);
    this.load();
  }

  protected selecionarFase(indice: number): void {
    this.faseSelecionada.set(indice);
    this.faseMobileAberta.set(true);
    if (this.modo() === 'compor') this.entryEmEdicao.set(null);
  }

  protected fecharFaseMobile(): void {
    this.faseMobileAberta.set(false);
  }

  protected abrirComposerDaFase(): void {
    if (!this.faseAtual()) return;
    this.entryEmEdicao.set(null);
    this.modo.set('compor');
  }

  protected editarLancamento(entryId: number): void {
    const entry = this.day()?.entries.find((item) => item.id === entryId) ?? null;
    if (!entry) return;

    const indiceFase = this.fases().findIndex((fase) => fase.mealId === entry.meal.id);
    if (indiceFase !== -1) this.faseSelecionada.set(indiceFase);

    this.entryEmEdicao.set(entry);
    this.modo.set('compor');
  }

  protected trocarDestino(meal: DiaryMeal): void {
    const indice = this.fases().findIndex((fase) => fase.mealId === meal.id);
    if (indice === -1) return;
    this.faseSelecionada.set(indice);
    // Trocar de destino sempre volta a criar um lançamento novo na fase de
    // chegada — editar um lançamento existente noutra refeição não faz sentido.
    this.entryEmEdicao.set(null);
  }

  protected cancelarComposer(): void {
    this.modo.set('cartao');
    this.entryEmEdicao.set(null);
    this.faseMobileAberta.set(false);
    this.limparQueryParamRegistrar();
  }

  protected onEntrySaved(): void {
    const fase = this.faseAtual();
    this.modo.set('cartao');
    this.entryEmEdicao.set(null);
    this.faseMobileAberta.set(false);
    this.limparQueryParamRegistrar();
    if (fase) {
      this.carimbo.set(fase.mealId);
      this.flash.set(
        this.transloco.translate('diaryPage.phaseUpdatedFlash', {
          meal: fase.descricao.toLowerCase(),
        }),
      );
    }
    this.loadDay();
  }

  protected removerItem(item: FaseItem): void {
    const entry = this.day()?.entries.find((registro) => registro.id === item.entryId);
    if (!entry) return;

    const payload = payloadSemItem(entry, item.foodId);
    if (
      !payload &&
      !window.confirm(
        this.transloco.translate('diaryPage.confirmRemoveOnlyItem', { item: item.descricao }),
      )
    ) {
      return;
    }

    const chave = chaveDoItem(item);
    this.removendo.set(chave);
    this.flash.set(null);

    const requisicao: Observable<unknown> = payload
      ? this.diaryService.updateEntry(entry.id, payload)
      : this.diaryService.deleteEntry(entry.id);

    requisicao
      .pipe(
        takeUntil(this.destruido),
        finalize(() => this.removendo.set(null)),
      )
      .subscribe({
        next: () => {
          this.toastr.success(
            this.transloco.translate('diaryPage.itemRemovedToast', { item: item.descricao }),
          );
          this.loadDay();
        },
        error: () => this.toastr.error(this.transloco.translate('diaryPage.errorRemoveItem')),
      });
  }

  protected onMealsChanged(): void {
    this.managerOpen.set(false);
    this.loadMeals();
  }

  private sincronizarFase(): void {
    const proxima = proximaFaseAberta(this.fases());
    this.faseSelecionada.set(proxima === -1 ? 0 : proxima);
  }

  private limparQueryParamRegistrar(): void {
    if (this.route.snapshot.queryParamMap.has('registrar')) {
      this.router.navigate([], {
        queryParams: { registrar: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  private changeDay(days: number): void {
    const next = new Date(`${this.selectedDate()}T12:00:00`);
    next.setDate(next.getDate() + days);
    const value = this.dateString(next);
    if (value > this.today) return;
    this.selectedDate.set(value);
    this.loadDay();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      day: this.diaryService.day(this.selectedDate()),
      meals: this.diaryService.meals(),
      metas: this.metaService.list(),
    })
      .pipe(
        takeUntil(this.destruido),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: ({ day, meals, metas }) => {
          this.day.set(day);
          this.meals.set(meals);
          this.meta.set(
            metas.find((item) => item.data === this.selectedDate()) ??
              metas.find((item) => item.data === null) ??
              metas[0] ??
              null,
          );
          this.faseMobileAberta.set(false);
          this.sincronizarFase();
          this.abrirSolicitado();
        },
        error: () => this.toastr.error(this.transloco.translate('diaryPage.errorLoadDiary')),
      });
  }

  private loadDay(): void {
    this.diaryService
      .day(this.selectedDate())
      .pipe(takeUntil(this.destruido))
      .subscribe({
        next: (day) => this.day.set(day),
        error: () => this.toastr.error(this.transloco.translate('diaryPage.errorUpdateEntries')),
      });
  }

  private abrirSolicitado(): void {
    if (!this.fases().length) return;
    if (this.pendingPlanMeal !== null && this.pendingPlanMeal < this.fases().length) {
      this.faseSelecionada.set(this.pendingPlanMeal);
    }
    this.pendingPlanMeal = null;
    this.abrirComposerDaFase();
  }

  private loadMeals(): void {
    this.diaryService
      .meals()
      .pipe(takeUntil(this.destruido))
      .subscribe({
        next: (meals) => {
          this.meals.set(meals);
          this.sincronizarFase();
        },
        error: () => this.toastr.error(this.transloco.translate('diaryPage.errorUpdateMeals')),
      });
  }

  private dateString(date: Date): string {
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
  }
}
