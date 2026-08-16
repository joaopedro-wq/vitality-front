import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { BdButtonComponent } from 'bandeira-ui';
import {
  LucideApple,
  LucideArrowLeft,
  LucideArrowRight,
  LucideSave,
  LucideCoffee,
  LucideInfo,
  LucideMoon,
  LucideMoonStar,
  LucidePencil,
  LucideSun,
  LucideSunrise,
  LucideSunset,
  LucideUtensils,
  LucideUtensilsCrossed,
  LucideX,
  type LucideIcon,
} from '@lucide/angular';
import { ToastrService } from 'ngx-toastr';
import { finalize, forkJoin, switchMap } from 'rxjs';

import { PlateLoaderComponent } from '../../../components/atoms/plate-loader/plate-loader.component';
import { BackButtonComponent } from '../../../components/molecules/back-button/back-button.component';
import { LoadingStateComponent } from '../../../components/molecules/loading-state/loading-state.component';
import { MealPlateComponent } from '../../../components/molecules/meal-plate/meal-plate.component';
import { PageTitleComponent } from '../../../components/molecules/page-title/page-title.component';
import {
  StepTrackComponent,
  type StepTrackItem,
} from '../../../components/molecules/step-track/step-track.component';
import { MealDrawerComponent } from '../../../components/organisms/meal-drawer/meal-drawer.component';
import { LoadingOverlayComponent } from '../../../components/organisms/loading-overlay/loading-overlay.component';
import { gateCarregamento } from '../../../components/utils/loading-gate.util';
import { MealPlanService } from '../../../services/meal-plan.service';
import { MetaService } from '../../../services/meta.service';
import { MealPlanDiaryDraftService } from '../../../core/meal-plan/meal-plan-diary-draft.service';
import type { Alimento } from '../../../core/models/alimento.model';
import type { MetaDiaria } from '../../../core/models/meta-diaria.model';
import type {
  MealPlanDraft,
  MealPlanItem,
  MealPlanItemSuggestion,
  MealPlanMeal,
  MealPlanPreferences,
  MealPlanStyle,
} from '../../../core/models/meal-plan.model';
import { RefeicoesStepComponent } from './steps/refeicoes-step/refeicoes-step.component';
import { EstiloStepComponent } from './steps/estilo-step/estilo-step.component';
import { EvitarStepComponent } from './steps/evitar-step/evitar-step.component';
import { RevisarStepComponent } from './steps/revisar-step/revisar-step.component';

const MENSAGENS_GERACAO: string[] = [
  'Escolhendo alimentos para o seu dia…',
  'Equilibrando proteína, carbo e gordura…',
  'Encaixando nos horários das refeições…',
  'Conferindo se bate com a sua meta…',
];

const TIMES: Record<3 | 4 | 5, string[]> = {
  3: ['08:00', '12:30', '19:30'],
  4: ['08:00', '12:30', '16:30', '20:00'],
  5: ['07:30', '10:30', '13:00', '16:30', '20:00'],
};

/** Ícone de período por horário — fallback quando o nome da refeição não bate com nada conhecido. */
const ICONES_PERIODO: ReadonlyArray<readonly [limite: number, icone: LucideIcon]> = [
  [10, LucideSunrise],
  [15, LucideSun],
  [18, LucideSunset],
  [24, LucideMoon],
];

/**
 * Ícone por tipo de refeição — mais coerente com o momento do dia do que só o
 * horário (ex.: "Lanche da tarde" às 16h vira maçã, não sol de tarde genérico).
 * Casa por palavra-chave no nome; refeição sem nome reconhecido cai no
 * fallback por horário (`ICONES_PERIODO`).
 */
const ICONES_REFEICAO: ReadonlyArray<readonly [palavras: string[], icone: LucideIcon]> = [
  [['café', 'manhã'], LucideCoffee],
  [['almoço'], LucideUtensils],
  [['lanche'], LucideApple],
  [['jantar'], LucideUtensilsCrossed],
  [['ceia'], LucideMoonStar],
];

const PASSOS_FORM: StepTrackItem[] = [
  { titulo: 'Refeições', descricao: 'Quantas por dia' },
  { titulo: 'Estilo', descricao: 'O que ajuda na rotina' },
  { titulo: 'Evitar', descricao: 'Opcional' },
  { titulo: 'Revisar', descricao: 'Confere antes de gerar' },
];

@Component({
  selector: 'vtp-dieta-form',
  standalone: true,
  imports: [
    DecimalPipe,
    BdButtonComponent,
    LucideArrowLeft,
    LucideArrowRight,
    LucideSave,
    LucideInfo,
    LucidePencil,
    LucideX,
    PlateLoaderComponent,
    BackButtonComponent,
    LoadingStateComponent,
    MealPlateComponent,
    MealDrawerComponent,
    PageTitleComponent,
    StepTrackComponent,
    LoadingOverlayComponent,
    RefeicoesStepComponent,
    EstiloStepComponent,
    EvitarStepComponent,
    RevisarStepComponent,
  ],
  templateUrl: './dieta-form.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DietaFormComponent {
  private readonly plansService = inject(MealPlanService);
  private readonly metaService = inject(MetaService);
  private readonly diaryDraft = inject(MealPlanDiaryDraftService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toastr = inject(ToastrService);

  protected readonly loading = signal(true);
  protected readonly loadingVisivel = gateCarregamento(this.loading);
  protected readonly generating = signal(false);
  protected readonly mensagensGeracao = MENSAGENS_GERACAO;
  protected readonly saving = signal(false);
  protected readonly regeneratingMeal = signal<number | null>(null);
  protected readonly suggesting = signal(false);
  protected readonly applyingChange = signal(false);
  protected readonly mode = signal<'form' | 'preview'>('form');
  protected readonly meta = signal<MetaDiaria | null>(null);
  protected readonly draft = signal<MealPlanDraft | null>(null);
  protected readonly mealCount = signal<3 | 4 | 5>(4);
  protected readonly style = signal<MealPlanStyle>('rapido');
  protected readonly title = signal('Meu plano do dia');
  protected readonly excluded = signal<Alimento[]>([]);
  protected readonly swapTarget = signal<{ meal: MealPlanMeal; item: MealPlanItem } | null>(null);
  protected readonly suggestions = signal<MealPlanItemSuggestion[]>([]);
  protected readonly swapFailureMessage = signal<string | null>(null);
  protected readonly pratoAberto = signal<number | null>(null);
  protected readonly passo = signal(0);
  protected readonly passosForm = PASSOS_FORM;
  protected readonly editando = signal(false);
  protected readonly planoEmEdicaoId = signal<number | null>(null);

  protected readonly dirty = signal(false);
  protected readonly editandoNome = signal(false);
  protected readonly rascunhoNome = signal('');
  private readonly inputNomeRef = viewChild<ElementRef<HTMLInputElement>>('inputNome');

  protected readonly pratoAtivo = computed(() => {
    const aberto = this.pratoAberto();
    if (aberto === null) return null;
    return this.draft()?.meals.find((meal) => meal.position === aberto) ?? null;
  });

  protected readonly indiceAtivo = computed(() => {
    const meals = this.draft()?.meals ?? [];
    const aberto = this.pratoAberto();
    const indice = meals.findIndex((meal) => meal.position === aberto);
    return indice === -1 ? 0 : indice;
  });

  protected readonly macroValores = computed(() => {
    const totals = this.draft()?.totals;
    if (!totals) return null;
    return {
      caloria: Math.round(totals.caloria),
      proteina: Math.round(totals.proteina),
      carbo: Math.round(totals.carbo),
      gordura: Math.round(totals.gordura),
    };
  });

  constructor() {
    this.iniciar();

    effect(() => {
      if (this.editandoNome()) {
        const input = this.inputNomeRef()?.nativeElement;
        input?.focus();
        input?.select();
      }
    });
  }

  protected iniciarEdicaoNome(): void {
    this.rascunhoNome.set(this.title());
    this.editandoNome.set(true);
  }

  protected confirmarNome(): void {
    const valor = this.rascunhoNome().trim();
    if (valor) {
      this.onTituloChange(valor);
    }
    this.editandoNome.set(false);
  }

  protected cancelarEdicaoNome(): void {
    this.editandoNome.set(false);
  }

  protected onNomeKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.confirmarNome();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelarEdicaoNome();
    }
  }

  protected selecionarPrato(position: number): void {
    if (this.pratoAberto() === position) return;
    this.pratoAberto.set(position);
    this.swapTarget.set(null);
    this.suggestions.set([]);
    this.swapFailureMessage.set(null);
  }

  protected mealAnterior(): void {
    const meals = this.draft()?.meals ?? [];
    const anterior = meals[this.indiceAtivo() - 1];
    if (anterior) this.selecionarPrato(anterior.position);
  }

  protected mealSeguinte(): void {
    const meals = this.draft()?.meals ?? [];
    const seguinte = meals[this.indiceAtivo() + 1];
    if (seguinte) this.selecionarPrato(seguinte.position);
  }

  /** Ícone Lucide da refeição — por tipo (nome) quando reconhecido, senão por horário. */
  protected iconeRefeicao(meal: MealPlanMeal): LucideIcon {
    const nome = meal.descricao.toLowerCase();
    const porTipo = ICONES_REFEICAO.find(([palavras]) =>
      palavras.some((palavra) => nome.includes(palavra)),
    );
    if (porTipo) return porTipo[1];
    const hora = Number(meal.horario.split(':')[0]);
    return ICONES_PERIODO.find(([limite]) => hora < limite)?.[1] ?? LucideMoon;
  }

  protected onTituloChange(valor: string): void {
    this.title.set(valor);
    this.dirty.set(true);
  }

  protected irParaPasso(indice: number): void {
    this.passo.set(indice);
  }

  protected onRefeicoesConcluido(valor: 3 | 4 | 5): void {
    this.mealCount.set(valor);
    this.passo.set(1);
  }

  protected onEstiloConcluido(valor: MealPlanStyle): void {
    this.style.set(valor);
    this.passo.set(2);
  }

  protected onEvitarConcluido(itens: Alimento[]): void {
    this.excluded.set(itens);
    this.passo.set(3);
  }

  protected generate(): void {
    const preferences: MealPlanPreferences = {
      meal_count: this.mealCount(),
      meal_times: TIMES[this.mealCount()],
      style: this.style(),
      excluded_food_ids: this.excluded().map((food) => food.id),
      diet_type: 'onivora',
      restriction_slugs: [],
    };
    this.generating.set(true);
    this.plansService
      .saveProfile(preferences)
      .pipe(switchMap(() => this.plansService.preview(preferences)))
      .pipe(finalize(() => this.generating.set(false)))
      .subscribe({
        next: (draft) => {
          this.draft.set(draft);
          this.mode.set('preview');
          this.pratoAberto.set(draft.meals[0]?.position ?? null);
          this.dirty.set(true);
          this.closeSwap();
        },
        error: () => undefined,
      });
  }

  protected save(): void {
    const draft = this.draft();
    const titulo = this.title().trim();
    if (!draft || !titulo || this.saving()) return;
    this.saving.set(true);
    const planoId = this.planoEmEdicaoId();
    const request = planoId
      ? this.plansService.update(planoId, { titulo, draft_id: draft.draft_id })
      : this.plansService.save({ titulo, draft_id: draft.draft_id });
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.dirty.set(false);
        this.toastr.success('Plano alimentar salvo.');
        this.router.navigateByUrl('/dietas');
      },
      error: () => undefined,
    });
  }

  protected regenerateMeal(position: number): void {
    const current = this.draft();
    if (!current || this.regeneratingMeal() !== null) return;
    this.regeneratingMeal.set(position);
    this.plansService
      .regenerateMeal(current.draft_id, position)
      .pipe(finalize(() => this.regeneratingMeal.set(null)))
      .subscribe({
        next: (replacement) => {
          this.draft.set(replacement);
          this.swapTarget.set(null);
          this.swapFailureMessage.set(null);
          this.dirty.set(true);
          this.toastr.success('Refeição reorganizada com uma nova combinação.');
        },
        error: () => undefined,
      });
  }

  protected openItemSwap(meal: MealPlanMeal, item: MealPlanItem): void {
    this.swapTarget.set({ meal, item });
    this.suggestions.set([]);
    this.swapFailureMessage.set(null);
  }

  protected closeSwap(): void {
    this.swapTarget.set(null);
    this.suggestions.set([]);
    this.swapFailureMessage.set(null);
  }

  protected loadSuggestions(): void {
    const draft = this.draft();
    const target = this.swapTarget();
    if (!draft || !target || this.suggesting()) return;
    this.suggesting.set(true);
    this.swapFailureMessage.set(null);
    this.plansService
      .itemSuggestions(draft.draft_id, target.meal.position, target.item.food_id)
      .pipe(finalize(() => this.suggesting.set(false)))
      .subscribe({
        next: (suggestions) => this.suggestions.set(suggestions),
        error: (error) => this.swapFailureMessage.set(this.extractSwapFailureMessage(error)),
      });
  }

  protected applySuggestion(suggestion: MealPlanItemSuggestion): void {
    const draft = this.draft();
    const target = this.swapTarget();
    if (!draft || !target || this.applyingChange()) return;
    this.applyingChange.set(true);
    this.plansService
      .replaceItem(
        draft.draft_id,
        target.meal.position,
        target.item.food_id,
        suggestion.food_id,
        suggestion.quantity,
      )
      .pipe(finalize(() => this.applyingChange.set(false)))
      .subscribe({
        next: (updated) => {
          this.draft.set(updated);
          this.dirty.set(true);
          this.closeSwap();
          this.toastr.success('Alimento substituído mantendo a meta da refeição.');
        },
        error: () => undefined,
      });
  }

  private extractSwapFailureMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const errors = error.error?.errors as Record<string, string[] | string> | undefined;
      const first = errors ? Object.values(errors)[0] : null;
      const message = Array.isArray(first) ? first[0] : first;
      if (message) return message;
      if (typeof error.error?.message === 'string') return error.error.message;
    }

    return 'Não encontramos uma troca individual que mantenha esta refeição próxima da meta. Reorganize a refeição completa para buscar uma combinação mais coerente.';
  }

  protected recreateDay(): void {
    const current = this.draft();
    if (!current || this.applyingChange()) return;
    if (
      !window.confirm(
        'Gerar um novo dia recria TODAS as refeições do zero. Qualquer troca manual feita nelas será substituída ou perdida. Continuar?',
      )
    )
      return;
    this.applyingChange.set(true);
    this.plansService
      .recreate(current.draft_id)
      .pipe(finalize(() => this.applyingChange.set(false)))
      .subscribe({
        next: (replacement) => {
          this.draft.set(replacement);
          this.dirty.set(true);
          this.closeSwap();
          this.toastr.success('Novo dia gerado.');
        },
        error: () => undefined,
      });
  }

  protected undo(): void {
    const current = this.draft();
    if (!current || this.applyingChange()) return;
    this.applyingChange.set(true);
    this.plansService
      .undo(current.draft_id)
      .pipe(finalize(() => this.applyingChange.set(false)))
      .subscribe({
        next: (draft) => {
          this.draft.set(draft);
          this.dirty.set(true);
          this.closeSwap();
          this.toastr.success('Última alteração desfeita.');
        },
        error: () => undefined,
      });
  }

  protected useMealFromDrawer(meal: MealPlanMeal): void {
    const current = this.draft();
    const mealIndex = current?.meals.findIndex((item) => item.position === meal.position) ?? -1;
    this.diaryDraft.prepare(0, meal.items);
    this.router.navigate(['/diario'], {
      queryParams: { registrar: 1, planMeal: mealIndex >= 0 ? mealIndex : null },
    });
  }

  private iniciar(): void {
    const planoId = this.route.snapshot.queryParamMap.get('planoId');
    const planoNome = this.route.snapshot.queryParamMap.get('planoNome');
    if (planoNome) this.title.set(planoNome);
    forkJoin({
      metas: this.metaService.list(),
      profile: this.plansService.profile(),
    }).subscribe({
      next: ({ metas, profile }) => {
        const metaAtual = metas.find((item) => item.data === null) ?? metas[0] ?? null;
        this.meta.set(metaAtual);
        this.mealCount.set(profile.meal_count);
        this.style.set(profile.style);

        if (!metaAtual) {
          this.router.navigateByUrl('/metas');
          return;
        }
        if (planoId) {
          this.carregarParaEdicao(Number(planoId));
        } else {
          this.loading.set(false);
        }
      },
      error: () => {
        this.toastr.error('Não foi possível carregar suas preferências agora.');
        this.loading.set(false);
      },
    });
  }

  private carregarParaEdicao(id: number): void {
    this.plansService
      .editDraft(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (draft) => {
          this.draft.set(draft);
          this.mode.set('preview');
          this.editando.set(true);
          this.planoEmEdicaoId.set(id);
          this.dirty.set(false);
          this.pratoAberto.set(draft.meals[0]?.position ?? null);
        },
        error: () => {
          this.toastr.error('Não foi possível abrir esse plano para edição.');
          this.router.navigateByUrl('/dietas');
        },
      });
  }
}
