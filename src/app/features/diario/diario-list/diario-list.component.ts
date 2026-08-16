import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { BdButtonComponent } from 'bandeira-ui';
import { LucideArrowLeft, LucideArrowRight, LucideSettings2 } from '@lucide/angular';
import { ToastrService } from 'ngx-toastr';
import { finalize, forkJoin, type Observable } from 'rxjs';

import { MacroGoalStripComponent } from '../../../components/molecules/macro-goal-strip/macro-goal-strip.component';
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
    BdButtonComponent,
    MacroGoalStripComponent,
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
export class DiarioListComponent {
  private readonly diaryService = inject(DiarioService);
  private readonly metaService = inject(MetaService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  protected readonly today = this.dateString(new Date());
  protected readonly selectedDate = signal(this.today);
  protected readonly day = signal<DiaryDay | null>(null);
  protected readonly meals = signal<DiaryMeal[]>([]);
  protected readonly meta = signal<MetaDiaria | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadingVisivel = gateCarregamento(this.loading);
  protected readonly managerOpen = signal(false);
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
    const alvo = this.meta()?.meta_calorias;
    const restante = alvo ? alvo - this.totals().caloria : null;
    if (restante !== null && restante > 0) {
      return `Nada registrado aqui ainda. Sobram ${Math.round(restante).toLocaleString('pt-BR')} kcal para o seu dia.`;
    }
    return 'Nada registrado aqui ainda. Escolha o que entrou no prato para concluir esta fase.';
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
    const consumido = Math.round(this.totals().caloria);
    const alvo = this.meta()?.meta_calorias;
    if (!alvo) return consumido > 0 ? `${consumido.toLocaleString('pt-BR')} kcal` : null;
    return `${consumido.toLocaleString('pt-BR')} / ${Math.round(alvo).toLocaleString('pt-BR')} kcal`;
  });

  protected readonly canGoNext = computed(() => this.selectedDate() < this.today);
  protected readonly dateLabel = computed(() => {
    const date = new Date(`${this.selectedDate()}T12:00:00`);
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);
  });

  constructor() {
    this.load();
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      if (params.get('registrar') !== '1') return;
      const planMeal = Number(params.get('planMeal'));
      this.pendingPlanMeal = Number.isInteger(planMeal) && planMeal >= 0 ? planMeal : null;
      this.abrirSolicitado();
    });
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
      this.flash.set(`Fase atualizada · registrado em ${fase.descricao.toLowerCase()}.`);
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
        `"${item.descricao}" é o único alimento deste lançamento. Remover apaga o lançamento inteiro. Continuar?`,
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

    requisicao.pipe(finalize(() => this.removendo.set(null))).subscribe({
      next: () => {
        this.toastr.success(`${item.descricao} removido.`);
        this.loadDay();
      },
      error: () => this.toastr.error('Não foi possível remover este alimento agora.'),
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
      .pipe(finalize(() => this.loading.set(false)))
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
        error: () => this.toastr.error('Não foi possível carregar seu Diário agora.'),
      });
  }

  private loadDay(): void {
    this.diaryService.day(this.selectedDate()).subscribe({
      next: (day) => this.day.set(day),
      error: () => this.toastr.error('Não foi possível atualizar os lançamentos.'),
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
    this.diaryService.meals().subscribe({
      next: (meals) => {
        this.meals.set(meals);
        this.sincronizarFase();
      },
      error: () => this.toastr.error('Não foi possível atualizar as refeições.'),
    });
  }

  private dateString(date: Date): string {
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
  }
}
