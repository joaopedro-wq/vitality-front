import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  LucideDynamicIcon,
  LucideFilter,
  LucideHeart,
  LucideSearch,
  LucideTrash2,
  LucideUtensils,
  type LucideIcon,
} from '@lucide/angular';
import { Subject, debounceTime, finalize, takeUntil } from 'rxjs';

import { ConfirmDialogComponent } from '../../../../components/molecules/confirm-dialog/confirm-dialog.component';
import { FoodPickCardComponent } from '../../../../components/molecules/food-pick-card/food-pick-card.component';
import { LoadingStateComponent } from '../../../../components/molecules/loading-state/loading-state.component';
import { PaginationControlsComponent } from '../../../../components/molecules/pagination-controls/pagination-controls.component';
import {
  PlateRowComponent,
  type PlateItem,
} from '../../../../components/molecules/plate-row/plate-row.component';
import { SortControlComponent } from '../../../../components/molecules/sort-control/sort-control.component';
import { StepFooterComponent } from '../../../../components/molecules/step-footer/step-footer.component';
import { gateCarregamento } from '../../../../components/utils/loading-gate.util';
import { escalarMacros, somarMacros } from '../../../../components/utils/diary-day.util';
import {
  ICONE_CATEGORIA_PADRAO,
  ICONE_POR_CATEGORIA,
} from '../../../../components/utils/food-category-icons.util';
import {
  FOOD_SORT_OPTIONS,
  direcaoOrdenacaoLabel,
  type FoodSortField,
} from '../../../../components/utils/food-sort-options.util';
import { LanguageService } from '../../../../core/i18n/language.service';
import type { Alimento, AlimentoGrupo } from '../../../../core/models/alimento.model';
import type { DiaryMacros } from '../../../../core/models/diary.model';
import { AlimentoService, type FoodFilters } from '../../../../services/alimento.service';

const TAMANHO_PAGINA = 20;

/** Atalho fixo de favoritos, na frente das categorias reais do catálogo —
 * mesmo vocabulário do `EntryComposerComponent` (Diário), sem o atalho
 * "Frequentes" de lá (vem de `DiarioService.recentFoods()`, não faz sentido
 * pra montar um plano do zero). */
const FILTRO_FAVORITOS = 'favoritos' as const;

interface FiltroRapidoChip {
  readonly id: string;
  readonly label: string;
  readonly icon: LucideIcon;
}

/**
 * Montagem de uma refeição do fluxo manual de dietas — modelado sobre
 * `EntryComposerComponent` (mesmo padrão de busca/paginação/ordenação e as
 * mesmas duas sub-fases: selecionar alimentos, revisar o prato). Só dado
 * 100% local: nada aqui chama `MealPlanService` — o `draft_id` só existe
 * depois que `ManualDietaFormComponent` monta todas as refeições e chama
 * `manualPreview()`.
 */
@Component({
  selector: 'vtp-meal-builder',
  standalone: true,
  imports: [
    DecimalPipe,
    NgTemplateOutlet,
    TranslocoPipe,
    ConfirmDialogComponent,
    FoodPickCardComponent,
    LoadingStateComponent,
    PaginationControlsComponent,
    PlateRowComponent,
    SortControlComponent,
    StepFooterComponent,
    LucideDynamicIcon,
    LucideFilter,
    LucideSearch,
    LucideTrash2,
    LucideUtensils,
  ],
  templateUrl: './meal-builder.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealBuilderComponent implements OnInit, OnDestroy {
  private readonly foodsService = inject(AlimentoService);
  private readonly transloco = inject(TranslocoService);
  private readonly language = inject(LanguageService);
  private readonly destruido = new Subject<void>();
  private readonly buscas = new Subject<string>();

  /** Índice da refeição atual dentro do plano — o pai reaproveita a MESMA
   * instância deste componente ao navegar entre refeições (o `@if` no
   * template do pai não desmonta/remonta, só troca os valores dos inputs).
   * Sem isso, `ngOnInit` só rodaria uma vez e o estado de uma refeição
   * vazaria pra próxima. */
  readonly mealIndex = input.required<number>();
  readonly horario = input.required<string>();
  readonly itensIniciais = input<PlateItem[]>([]);

  readonly concluir = output<PlateItem[]>();
  readonly voltarFase = output<void>();
  readonly itensChange = output<PlateItem[]>();

  protected readonly subFase = signal<'selecionar' | 'revisar'>('selecionar');
  protected readonly itens = signal<PlateItem[]>([]);
  protected readonly removerRefeicaoAberto = signal(false);

  protected readonly query = signal('');
  protected readonly resultados = signal<Alimento[]>([]);
  protected readonly carregando = signal(false);
  protected readonly carregandoVisivel = gateCarregamento(this.carregando);
  protected readonly pagina = signal(1);
  protected readonly totalRegistros = signal(0);
  protected readonly tamanhoPagina = TAMANHO_PAGINA;
  protected readonly sortOptions = FOOD_SORT_OPTIONS;
  protected readonly sortField = signal<FoodSortField>('descricao');
  protected readonly sortOrder = signal<1 | -1>(1);
  protected readonly direcaoOrdenacao = computed(() =>
    direcaoOrdenacaoLabel(this.sortField(), this.sortOrder()),
  );

  /** Chips de filtro rápido — favoritos + categoria real do catálogo, mesmo
   * padrão do Diário (`EntryComposerComponent`). */
  protected readonly categorias = signal<AlimentoGrupo[]>([]);
  protected readonly filtroRapido = signal<string | null>(null);
  /** Estado da folha inferior de filtro no mobile — irrelevante em telas
   * ≥768px, onde busca/ordenar/chips ficam sempre visíveis (ver template). */
  protected readonly filtrosAbertos = signal(false);

  protected readonly filtrosRapidos = computed<readonly FiltroRapidoChip[]>(() => {
    this.language.locale();
    return [
      {
        id: FILTRO_FAVORITOS,
        label: this.transloco.translate('dietPlan.manual.filters.favoritesLabel'),
        icon: LucideHeart,
      },
      ...this.categorias().map((categoria) => ({
        id: categoria.id,
        label: categoria.label,
        icon: ICONE_POR_CATEGORIA[categoria.id] ?? ICONE_CATEGORIA_PADRAO,
      })),
    ];
  });

  protected readonly filtroAtivoLabel = computed(() => {
    return this.filtrosRapidos().find((filtro) => filtro.id === this.filtroRapido())?.label ?? null;
  });

  protected readonly totais = computed<DiaryMacros>(() =>
    somarMacros(
      this.itens().map((item) => ({
        macros: escalarMacros(item.macrosRef, item.qtdRef, item.quantity),
      })),
    ),
  );

  constructor() {
    // Reage à troca de refeição (não a edições de itens dentro da mesma
    // refeição — por isso lê `itensIniciais`/reseta busca via `untracked`,
    // fora do rastreio de dependências do effect).
    effect(() => {
      this.mealIndex();
      untracked(() => {
        this.itens.set(this.itensIniciais());
        this.subFase.set('selecionar');
        this.query.set('');
        this.filtroRapido.set(null);
        this.filtrosAbertos.set(false);
        this.pagina.set(1);
        this.buscarResultados(1);
      });
    });
  }

  ngOnInit(): void {
    this.buscas.pipe(debounceTime(300), takeUntil(this.destruido)).subscribe((termo) => {
      this.query.set(termo);
      this.pagina.set(1);
      this.buscarResultados(1);
    });

    this.foodsService
      .gruposNormalizados()
      .pipe(takeUntil(this.destruido))
      .subscribe({
        next: (categorias) => this.categorias.set(categorias),
        error: () => this.categorias.set([]),
      });
  }

  ngOnDestroy(): void {
    this.destruido.next();
    this.destruido.complete();
  }

  protected buscar(termo: string): void {
    this.buscas.next(termo.trim());
  }

  protected mudarPagina(pagina: number): void {
    this.pagina.set(pagina);
    this.buscarResultados(pagina);
  }

  protected alterarCampoOrdenacao(campo: FoodSortField): void {
    this.sortField.set(campo);
    this.pagina.set(1);
    this.buscarResultados(1);
  }

  protected alterarOrdem(ordem: 1 | -1): void {
    this.sortOrder.set(ordem);
    this.pagina.set(1);
    this.buscarResultados(1);
  }

  /** Toca de novo no chip ativo desliga o filtro — mesmo padrão de toggle do
   * `EntryComposerComponent`. */
  protected selecionarFiltro(id: string): void {
    this.filtroRapido.set(this.filtroRapido() === id ? null : id);
    this.pagina.set(1);
    this.buscarResultados(1);
    this.filtrosAbertos.set(false);
  }

  protected estaNoPrato(food: Alimento): boolean {
    return this.itens().some((item) => item.foodId === food.id);
  }

  protected escolher(food: Alimento): void {
    if (this.estaNoPrato(food)) {
      this.tirar(food.id);
      return;
    }
    this.itens.update((itens) => [
      ...itens,
      {
        foodId: food.id,
        descricao: food.descricao,
        detalheExibicao: food.detalhe_exibicao,
        illustrationKey: food.illustration_key,
        quantity: food.qtd,
        qtdRef: food.qtd,
        macrosRef: {
          caloria: food.caloria,
          proteina: food.proteina,
          carbo: food.carbo,
          gordura: food.gordura,
        },
        porcaoBase: food.qtd,
      },
    ]);
    this.itensChange.emit(this.itens());
  }

  protected ajustarQuantidade(foodId: number, quantidade: number): void {
    this.itens.update((itens) =>
      itens.map((item) => (item.foodId === foodId ? { ...item, quantity: quantidade } : item)),
    );
    this.itensChange.emit(this.itens());
  }

  protected tirar(foodId: number): void {
    this.itens.update((itens) => itens.filter((item) => item.foodId !== foodId));
    this.itensChange.emit(this.itens());
  }

  protected solicitarRemoverRefeicao(): void {
    this.removerRefeicaoAberto.set(true);
  }

  protected cancelarRemoverRefeicao(): void {
    this.removerRefeicaoAberto.set(false);
  }

  protected confirmarRemoverRefeicao(): void {
    this.removerRefeicaoAberto.set(false);
    this.itens.set([]);
    this.itensChange.emit([]);
    this.subFase.set('selecionar');
  }

  protected voltar(): void {
    if (this.subFase() === 'revisar') {
      this.subFase.set('selecionar');
      return;
    }
    this.voltarFase.emit();
  }

  protected avancar(): void {
    if (this.subFase() === 'selecionar') {
      if (!this.itens().length) return;
      this.subFase.set('revisar');
      return;
    }
    this.concluir.emit(this.itens());
  }

  private buscarResultados(pagina: number): void {
    this.carregando.set(true);
    const filtro = this.filtroRapido();
    const filters: FoodFilters = {
      page: pagina,
      search: this.query() || undefined,
      tab: filtro === FILTRO_FAVORITOS ? 'favorites' : 'all',
      categoria: filtro && filtro !== FILTRO_FAVORITOS ? [filtro] : undefined,
      sort_field: this.sortField(),
      sort_order: this.sortOrder() === -1 ? 'desc' : 'asc',
    };
    this.foodsService
      .list(filters)
      .pipe(
        takeUntil(this.destruido),
        finalize(() => this.carregando.set(false)),
      )
      .subscribe({
        next: (resposta) => {
          this.resultados.set(resposta.data);
          this.totalRegistros.set(resposta.meta.total);
        },
        error: () => {
          this.resultados.set([]);
          this.totalRegistros.set(0);
        },
      });
  }
}
