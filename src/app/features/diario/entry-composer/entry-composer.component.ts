import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { BdModalComponent } from 'bandeira-ui';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  LucideArrowLeftRight,
  LucideBean,
  LucideBeef,
  LucideCandy,
  LucideCheck,
  LucideCherry,
  LucideClipboardList,
  LucideClock,
  LucideCupSoda,
  LucideDroplet,
  LucideDynamicIcon,
  LucideEdit3,
  LucideFilter,
  LucideHeart,
  LucideMilk,
  LucideNut,
  LucidePackage,
  LucidePlus,
  LucideSalad,
  LucideSearch,
  LucideTrash2,
  LucideUtensils,
  LucideWheat,
  type LucideIcon,
} from '@lucide/angular';
import { Subject, catchError, debounceTime, finalize, forkJoin, of, takeUntil } from 'rxjs';

import { FoodIllustrationComponent } from '../../../components/atoms/food-illustration/food-illustration.component';
import { PlateLoaderComponent } from '../../../components/atoms/plate-loader/plate-loader.component';
import { DiaryDestinationBandComponent } from '../../../components/molecules/diary-destination-band/diary-destination-band.component';
import { FoodPickCardComponent } from '../../../components/molecules/food-pick-card/food-pick-card.component';
import {
  PlateRowComponent,
  type PlateItem,
} from '../../../components/molecules/plate-row/plate-row.component';
import { StepFooterComponent } from '../../../components/molecules/step-footer/step-footer.component';
import { NutritionRevealComponent } from '../../../components/molecules/nutrition-reveal/nutrition-reveal.component';
import {
  chaveDoItem,
  escalarMacros,
  somarMacros,
  type FaseItem,
} from '../../../components/utils/diary-day.util';
import { somarNutrientesDaRefeicao } from '../../../components/utils/meal-nutrition.util';
import { calcularProporcaoMacro } from '../../../components/utils/macro-percent.util';
import type { Alimento } from '../../../core/models/alimento.model';
import type {
  DiaryEntry,
  DiaryMacros,
  DiaryMeal,
  DiaryNutrient,
} from '../../../core/models/diary.model';
import { LoadingStateComponent } from '../../../components/molecules/loading-state/loading-state.component';
import { PaginationControlsComponent } from '../../../components/molecules/pagination-controls/pagination-controls.component';
import { SortControlComponent } from '../../../components/molecules/sort-control/sort-control.component';
import { gateCarregamento } from '../../../components/utils/loading-gate.util';
import {
  FOOD_SORT_OPTIONS,
  compararAlimentos,
  direcaoOrdenacaoLabel,
  type FoodSortField,
} from '../../../components/utils/food-sort-options.util';
import type { AlimentoGrupo } from '../../../core/models/alimento.model';
import { AlimentoService, type FoodFilters } from '../../../services/alimento.service';
import { DiarioService } from '../../../services/diario.service';
import { MealPlanDiaryDraftService } from '../../../core/meal-plan/meal-plan-diary-draft.service';
import { MealPlanService } from '../../../services/meal-plan.service';
import type { MealPlan, MealPlanMeal, MealPlanStyle } from '../../../core/models/meal-plan.model';
import { LanguageService } from '../../../core/i18n/language.service';

/** Os dois únicos "filtros" que não são categoria real do catálogo — atalhos
 * de recência, sempre capados em 12 itens, nunca paginados (ver `catalogo`). */
type FiltroFixoId = 'frequentes' | 'favoritos';

interface FiltroRapido {
  readonly id: FiltroFixoId | string;
  readonly label: string;
  readonly icon: LucideIcon;
}

const FILTROS_FIXOS_ICONES: Record<FiltroFixoId, LucideIcon> = {
  frequentes: LucideClock,
  favoritos: LucideHeart,
};

const ICONE_POR_CATEGORIA: Record<string, LucideIcon> = {
  'carnes-e-aves': LucideBeef,
  'peixes-e-frutos-do-mar': LucideBeef,
  ovos: LucideMilk,
  'graos-cereais-e-massas': LucideWheat,
  'paes-e-preparacoes': LucideWheat,
  leguminosas: LucideBean,
  'verduras-e-legumes': LucideSalad,
  frutas: LucideCherry,
  'leites-e-derivados': LucideMilk,
  'oleaginosas-e-sementes': LucideNut,
  'oleos-e-gorduras': LucideDroplet,
  'doces-e-sobremesas': LucideCandy,
  bebidas: LucideCupSoda,
};
const ICONE_PADRAO = LucidePackage;
const TAMANHO_PAGINA = 20;

@Component({
  selector: 'vtp-entry-composer',
  standalone: true,
  imports: [
    TranslocoPipe,
    DecimalPipe,
    NgTemplateOutlet,
    BdModalComponent,
    FoodIllustrationComponent,
    PlateLoaderComponent,
    DiaryDestinationBandComponent,
    FoodPickCardComponent,
    PlateRowComponent,
    StepFooterComponent,
    NutritionRevealComponent,
    LucideArrowLeftRight,
    LucideCheck,
    LucideClipboardList,
    LucideDynamicIcon,
    LucideEdit3,
    LucideFilter,
    LucidePlus,
    LucideSearch,
    LucideTrash2,
    LucideUtensils,
    LoadingStateComponent,
    PaginationControlsComponent,
    SortControlComponent,
  ],
  templateUrl: './entry-composer.component.html',
  styles: [
    // `vtp-entry-composer` continua sendo um card inline (não um modal) —
    // igual sempre foi. Só o diálogo de "Escolher plano" (classe
    // `plano-modal`) é um `bd-modal` de verdade, e precisa de mais espaço
    // pros crachás de plano do que o padrão da lib (480px). `!important` é
    // necessário mesmo: a regra própria do `bd-modal`
    // (`.bd-modal__panel[_ngcontent-...]`) só é criada no DOM quando aquele
    // modal abre — depois do `<style>` deste componente já estar inserido —
    // e como as duas regras têm a mesma especificidade (classe + atributo),
    // sem `!important` a da lib vence por ordem de inserção, não por
    // especificidade.
    ':host { display: block; }',
    ':host ::ng-deep bd-modal.plano-modal .bd-modal__panel { max-width: min(94vw, 1080px) !important; }',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryComposerComponent implements OnDestroy {
  protected readonly chaveDoItem = chaveDoItem;

  readonly meal = input.required<DiaryMeal>();
  readonly meals = input.required<DiaryMeal[]>();
  readonly date = input.required<string>();
  readonly entry = input<DiaryEntry | null>(null);
  readonly itensRegistrados = input<readonly FaseItem[]>([]);
  readonly removendo = input<string | null>(null);

  readonly cancelado = output<void>();
  readonly salvo = output<void>();
  readonly editarLancamento = output<number>();
  readonly removerItem = output<FaseItem>();
  readonly trocarMeal = output<DiaryMeal>();

  private readonly foodsService = inject(AlimentoService);
  private readonly diary = inject(DiarioService);
  private readonly planDraft = inject(MealPlanDiaryDraftService);
  private readonly plansService = inject(MealPlanService);
  private readonly language = inject(LanguageService);
  private readonly transloco = inject(TranslocoService);
  private readonly buscas = new Subject<string>();
  private readonly destruido = new Subject<void>();
  private requisicaoDeNutrientes = 0;

  protected readonly query = signal('');
  protected readonly resultadosBusca = signal<Alimento[]>([]);
  protected readonly recentes = signal<Alimento[]>([]);
  protected readonly favoritos = signal<Alimento[]>([]);
  protected readonly categorias = signal<AlimentoGrupo[]>([]);
  protected readonly filtroRapido = signal<FiltroFixoId | string | null>(null);
  /** Estado da folha inferior de filtro no mobile — irrelevante em telas
   * ≥768px, onde a fileira de chips fica sempre visível (ver template). */
  protected readonly filtrosAbertos = signal(false);
  protected readonly carregandoFoods = signal(false);
  protected readonly carregandoFoodsVisivel = gateCarregamento(this.carregandoFoods);
  protected readonly pagina = signal(1);
  protected readonly totalRegistros = signal(0);
  protected readonly tamanhoPagina = TAMANHO_PAGINA;
  protected readonly sortOptions = FOOD_SORT_OPTIONS;
  protected readonly sortField = signal<FoodSortField>('descricao');
  protected readonly sortOrder = signal<1 | -1>(1);
  protected readonly direcaoOrdenacao = computed(() =>
    direcaoOrdenacaoLabel(this.sortField(), this.sortOrder()),
  );

  /** Fileira de chips: os dois pseudo-filtros fixos (recência) na frente,
   * seguidos por toda categoria real do catálogo (fonte única de verdade no
   * backend, `FoodCatalogService::displayGroups()`) — o backend só devolve
   * categorias com pelo menos 1 alimento, então a fileira nunca mostra uma
   * categoria vazia. */
  protected readonly filtrosRapidos = computed<readonly FiltroRapido[]>(() => {
    this.language.locale();
    return [
      {
        id: 'frequentes' as const,
        label: this.transloco.translate('entry.frequent'),
        icon: FILTROS_FIXOS_ICONES.frequentes,
      },
      {
        id: 'favoritos' as const,
        label: this.transloco.translate('entry.favorites'),
        icon: FILTROS_FIXOS_ICONES.favoritos,
      },
      ...this.categorias().map((categoria) => ({
        id: categoria.id,
        label: categoria.label,
        icon: ICONE_POR_CATEGORIA[categoria.id] ?? ICONE_PADRAO,
      })),
    ];
  });

  /** Rótulo do gatilho da folha de filtro no mobile — nome do filtro ativo,
   * ou `null` quando nenhum está selecionado (o template cai pro texto
   * genérico "Filtrar"). */
  protected readonly filtroAtivoLabel = computed(() => {
    if (this.query()) return `"${this.query()}"`;
    return this.filtrosRapidos().find((filtro) => filtro.id === this.filtroRapido())?.label ?? null;
  });

  /** Paginação real (mesmo padrão de `/alimentos`) só faz sentido navegando
   * o catálogo de verdade — busca por texto ou categoria ativa. Os atalhos
   * de recência (Frequentes/Favoritos) continuam sugestão curta, sem página. */
  protected readonly paginacaoVisivel = computed(() => {
    const filtro = this.filtroRapido();
    return !!this.query() || (!!filtro && !this.ehFiltroFixo(filtro));
  });
  protected readonly itens = signal<PlateItem[]>([]);
  protected readonly salvando = signal(false);
  protected readonly trocaAberta = signal(false);
  protected readonly hora = signal('12:00');
  protected readonly passo = signal<'selecionar' | 'revisar'>('selecionar');
  protected readonly nutrientes = signal<DiaryNutrient[]>([]);
  protected readonly carregandoNutrientes = signal(false);
  protected readonly planosDisponiveis = signal<MealPlan[]>([]);
  protected readonly planoSelecionadoHero = signal<MealPlan | null>(null);
  protected readonly planoDialogAberto = signal(false);
  protected readonly modoAdicionarMais = signal(false);

  /** Atalhos por recência: mistura recentes + favoritos, igual sempre foi —
   * é o catálogo padrão quando nenhum filtro rápido está ativo. */
  protected readonly atalhos = computed(() => {
    const vistos = new Set<number>();
    return [...this.recentes(), ...this.favoritos()]
      .filter((food) => {
        if (vistos.has(food.id)) return false;
        vistos.add(food.id);
        return true;
      })
      .slice(0, 12);
  });

  /** Sugestão pro plano escolhido dentro da própria carta — não reage a
   * busca/filtro de categoria, então a carta nunca muda de tamanho enquanto
   * a pessoa navega o catálogo abaixo dela. */
  protected readonly sugestaoHero = computed<MealPlanMeal | null>(() =>
    this.entry() ? null : this.refeicaoMaisProxima(this.planoSelecionadoHero()),
  );

  /** Uma visão de cada vez: enquanto a pessoa não pede pra adicionar mais
   * (ou entrar editando um lançamento específico), a refeição já registrada
   * mostra só o resumo — nunca o resumo e o fluxo de busca ao mesmo tempo. */
  protected readonly mostrarResumoRegistrado = computed(
    () => !this.entry() && this.itensRegistrados().length > 0 && !this.modoAdicionarMais(),
  );

  /** Busca por texto e categoria real chegam ordenadas do backend
   * (`sort_field`/`sort_order` em `buscarResultados`). Os atalhos de
   * recência (Frequentes/Favoritos/mistura padrão) nunca passam pelo
   * backend paginado — a ordenação deles é aplicada aqui, client-side, com
   * o mesmo critério do `vtp-sort-control`, senão o controle fica mudo
   * nesses três estados. */
  protected readonly catalogo = computed(() => {
    if (this.query()) return this.resultadosBusca();

    const filtro = this.filtroRapido();
    if (filtro && !this.ehFiltroFixo(filtro)) return this.resultadosBusca();

    const lista =
      filtro === 'frequentes'
        ? this.recentes()
        : filtro === 'favoritos'
          ? this.favoritos()
          : this.atalhos();
    const campo = this.sortField();
    const ordem = this.sortOrder();
    return [...lista].sort((a, b) => compararAlimentos(a, b, campo, ordem));
  });

  /** Rótulo da seção de catálogo quando a busca está vazia — muda conforme o
   * filtro rápido ativo, pra nunca dizer "alimentos de sempre" em cima de uma
   * grade filtrada por categoria. */
  protected readonly catalogoRotulo = computed(() => {
    const filtro = this.filtroRapido();
    if (!filtro) return this.transloco.translate('entry.usualFoods');
    return `${this.filtrosRapidos().find((item) => item.id === filtro)?.label ?? ''}`;
  });

  protected readonly totais = computed<DiaryMacros>(() =>
    somarMacros(
      this.itens().map((item) => ({
        macros: escalarMacros(item.macrosRef, item.qtdRef, item.quantity),
      })),
    ),
  );

  constructor() {
    this.buscas.pipe(debounceTime(300), takeUntil(this.destruido)).subscribe((termo) => {
      this.query.set(termo);
      this.pagina.set(1);
      if (termo) this.buscarResultados(1);
      else this.resultadosBusca.set([]);
    });

    this.carregarAtalhos();
    this.carregarCategorias();
    this.carregarPlanosSugeridos();

    // Rascunho novo a cada troca de destino ou de lançamento em edição.
    effect(() => {
      const entry = this.entry();
      const meal = this.meal();
      const date = this.date();

      this.trocaAberta.set(false);
      this.modoAdicionarMais.set(false);
      this.passo.set('selecionar');
      this.nutrientes.set([]);
      this.carregandoNutrientes.set(false);
      this.requisicaoDeNutrientes += 1;

      if (entry) {
        this.hora.set(new Date(entry.consumed_at).toTimeString().slice(0, 5));
        this.itens.set(
          entry.items.map((item) => ({
            foodId: item.food_id,
            descricao: item.descricao,
            detalheExibicao: item.detalhe_exibicao,
            illustrationKey: item.illustration_key,
            quantity: item.quantity,
            // O snapshot de macros do backend corresponde exatamente à quantidade
            // gravada — é essa a referência, não a porção do catálogo.
            qtdRef: item.quantity,
            macrosRef: item.macros,
          })),
        );
        this.resolverPorcoesBase(entry.items.map((item) => item.food_id));
        return;
      }

      this.hora.set(this.horaSugerida(meal, date));
      const planDraft = this.planDraft.takeFor(meal.id);
      if (!planDraft) {
        this.itens.set([]);
        return;
      }
      this.itens.set(
        planDraft.items.map((item) => ({
          foodId: item.food_id,
          descricao: item.descricao,
          detalheExibicao: item.detalhe_exibicao ?? null,
          illustrationKey: null,
          quantity: item.quantity,
          qtdRef: item.quantity,
          macrosRef: item.macros,
        })),
      );
      this.resolverPorcoesBase(planDraft.items.map((item) => item.food_id));
    });
  }

  ngOnDestroy(): void {
    this.destruido.next();
    this.destruido.complete();
  }

  protected buscar(termo: string): void {
    this.buscas.next(termo.trim());
  }

  /** Alterna o filtro rápido (Frequentes/Favoritos/categoria) — tocar de novo
   * no mesmo chip desmarca e volta pro catálogo padrão. Toda troca reinicia
   * a paginação, mesma regra de `/alimentos` (`reiniciarPaginacao`). */
  protected selecionarFiltro(id: FiltroFixoId | string): void {
    const proximo = this.filtroRapido() === id ? null : id;
    this.filtroRapido.set(proximo);
    this.pagina.set(1);

    if (proximo && !this.ehFiltroFixo(proximo)) this.buscarResultados(1);
    else this.resultadosBusca.set([]);
  }

  /** Handler do `(paginaChange)` do `vtp-pagination-controls`. */
  protected mudarPagina(pagina: number): void {
    this.pagina.set(pagina);
    this.buscarResultados(pagina);
  }

  /** Handlers do `vtp-sort-control` — toda troca de critério ou direção
   * reinicia a paginação, mesma regra de `/alimentos`. Só têm efeito com
   * busca por texto ou categoria ativa (os atalhos de recência não pedem
   * ordenação ao backend). */
  protected alterarCampoOrdenacao(campo: FoodSortField): void {
    this.sortField.set(campo);
    this.pagina.set(1);
    if (this.paginacaoVisivel()) this.buscarResultados(1);
  }

  protected alterarOrdem(ordem: 1 | -1): void {
    this.sortOrder.set(ordem);
    this.pagina.set(1);
    if (this.paginacaoVisivel()) this.buscarResultados(1);
  }

  private ehFiltroFixo(id: FiltroFixoId | string): id is FiltroFixoId {
    return id === 'frequentes' || id === 'favoritos';
  }

  /** Troca qual plano alimenta a sugestão dentro da carta e fecha o diálogo. */
  protected selecionarPlanoHero(plano: MealPlan): void {
    this.planoSelecionadoHero.set(plano);
    this.planoDialogAberto.set(false);
  }

  /** `bd-modal` fecha sozinho no Esc/clique no fundo/X — isso só repassa pro
   * signal local, mesmo padrão de `meal-manager`/`day-reveal-overlay`. */
  protected onPlanoDialogChange(open: boolean): void {
    this.planoDialogAberto.set(open);
  }

  protected formatStyle(style: MealPlanStyle): string {
    return {
      rapido: this.transloco.translate('entry.styleFast'),
      caseiro: this.transloco.translate('entry.styleHomemade'),
      economico: this.transloco.translate('entry.styleEconomic'),
    }[style];
  }

  /** Mesmo anel-crachá da lista de Dietas: conic-gradient com a proporção real
   * de proteína · carbo · gordura do plano. */
  protected ringBackground(plano: MealPlan): string {
    const { proteina, carbo } = calcularProporcaoMacro(plano.totals);
    const p1 = Math.round(proteina);
    const p2 = Math.round(proteina + carbo);
    return `conic-gradient(var(--bd-primary) 0 ${p1}%, var(--bd-accent) ${p1}% ${p2}%, var(--fat) ${p2}% 100%)`;
  }

  /** Copia a refeição do plano para o editor; porções e itens continuam editáveis. */
  protected aplicarRefeicaoDoPlano(refeicao: MealPlanMeal): void {
    this.itens.set(
      refeicao.items.map((item) => ({
        foodId: item.food_id,
        descricao: item.descricao,
        detalheExibicao: item.detalhe_exibicao ?? null,
        illustrationKey: null,
        quantity: item.quantity,
        qtdRef: item.quantity,
        macrosRef: item.macros,
      })),
    );
    this.resolverPorcoesBase(refeicao.items.map((item) => item.food_id));
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
  }

  protected estaNoPrato(food: Alimento): boolean {
    return this.itens().some((item) => item.foodId === food.id);
  }

  protected ajustarQuantidade(foodId: number, quantidade: number): void {
    this.itens.update((itens) =>
      itens.map((item) => (item.foodId === foodId ? { ...item, quantity: quantidade } : item)),
    );
  }

  protected tirar(foodId: number): void {
    this.itens.update((itens) => itens.filter((item) => item.foodId !== foodId));
  }

  protected voltar(): void {
    if (this.passo() === 'revisar') {
      this.requisicaoDeNutrientes += 1;
      this.carregandoNutrientes.set(false);
      this.passo.set('selecionar');
      return;
    }
    this.cancelado.emit();
  }

  protected avancar(): void {
    if (this.passo() === 'selecionar') {
      if (!this.itens().length) return;
      this.abrirRevisao();
      return;
    }
    this.salvar();
  }

  protected salvar(): void {
    const itens = this.itens();
    if (!itens.length) return;

    const consumidoEm = new Date(`${this.date()}T${this.hora()}:00`);
    if (Number.isNaN(consumidoEm.getTime())) return;

    const payload = {
      meal_id: this.meal().id,
      consumed_at: consumidoEm.toISOString(),
      items: itens.map((item) => ({ food_id: item.foodId, quantity: item.quantity })),
    };

    const entry = this.entry();
    this.salvando.set(true);

    const requisicao = entry
      ? this.diary.updateEntry(entry.id, payload)
      : this.diary.createEntry(payload);

    // Sem toast de erro próprio: o `errorInterceptor` já mostra a mensagem real do
    // backend — inclusive a de consumo futuro, que é a que mais aparece aqui.
    requisicao
      .pipe(
        takeUntil(this.destruido),
        finalize(() => this.salvando.set(false)),
      )
      .subscribe({
        next: () => this.salvo.emit(),
        error: () => undefined,
      });
  }

  private abrirRevisao(): void {
    const itens = this.itens();
    const requisicaoAtual = ++this.requisicaoDeNutrientes;
    this.nutrientes.set([]);
    this.carregandoNutrientes.set(true);
    this.passo.set('revisar');

    forkJoin(
      itens.map((item) => this.foodsService.get(item.foodId).pipe(catchError(() => of(null)))),
    )
      .pipe(
        takeUntil(this.destruido),
        finalize(() => {
          if (requisicaoAtual === this.requisicaoDeNutrientes) {
            this.carregandoNutrientes.set(false);
          }
        }),
      )
      .subscribe((alimentos) => {
        if (requisicaoAtual !== this.requisicaoDeNutrientes) return;
        this.nutrientes.set(
          somarNutrientesDaRefeicao(
            itens,
            alimentos.filter((alimento): alimento is Alimento => alimento !== null),
          ),
        );
      });
  }

  private horaSugerida(meal: DiaryMeal, date: string): string {
    const daRefeicao = meal.horario.slice(0, 5);
    const agora = new Date();
    const hoje = new Date(agora.getTime() - agora.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 10);

    if (date !== hoje) return daRefeicao;

    const horaAtual = agora.toTimeString().slice(0, 5);
    return daRefeicao > horaAtual ? horaAtual : daRefeicao;
  }

  private carregarAtalhos(): void {
    this.diary
      .recentFoods()
      .pipe(
        catchError(() => of<Alimento[]>([])),
        takeUntil(this.destruido),
      )
      .subscribe((recentes) => this.recentes.set(recentes));

    this.foodsService
      .list({ tab: 'favorites', page: 1 })
      .pipe(
        catchError(() => of({ data: [] as Alimento[] })),
        takeUntil(this.destruido),
      )
      .subscribe((pagina) => this.favoritos.set(pagina.data));
  }

  private carregarPlanosSugeridos(): void {
    this.plansService
      .list()
      .pipe(
        catchError(() => of<MealPlan[]>([])),
        takeUntil(this.destruido),
      )
      .subscribe((planos) => {
        const ativos = planos.filter((plano) => !plano.archived_at);
        this.planosDisponiveis.set(ativos);
        const favoritado = ativos.find((plano) => plano.favorited_at !== null);
        this.planoSelecionadoHero.set(favoritado ?? ativos[0] ?? null);
      });
  }

  private buscarResultados(pagina: number): void {
    this.carregandoFoods.set(true);
    const filtro = this.filtroRapido();
    const filters: FoodFilters = {
      tab: 'all',
      page: pagina,
      search: this.query() || undefined,
      categoria: !this.query() && filtro && !this.ehFiltroFixo(filtro) ? [filtro] : undefined,
      sort_field: this.sortField(),
      sort_order: this.sortOrder() === -1 ? 'desc' : 'asc',
    };
    this.foodsService
      .list(filters)
      .pipe(
        takeUntil(this.destruido),
        finalize(() => this.carregandoFoods.set(false)),
      )
      .subscribe({
        next: (resposta) => {
          this.resultadosBusca.set(resposta.data);
          this.totalRegistros.set(resposta.meta.total);
        },
        error: () => {
          this.resultadosBusca.set([]);
          this.totalRegistros.set(0);
        },
      });
  }

  private carregarCategorias(): void {
    this.foodsService
      .gruposNormalizados()
      .pipe(
        catchError(() => of<AlimentoGrupo[]>([])),
        takeUntil(this.destruido),
      )
      .subscribe((categorias) => this.categorias.set(categorias));
  }

  private resolverPorcoesBase(foodIds: number[]): void {
    const bases = new Map<number, number>(
      [...this.atalhos(), ...this.resultadosBusca()].map((food) => [food.id, food.qtd]),
    );
    const faltantes = foodIds.filter((id) => !bases.has(id));

    if (!faltantes.length) {
      this.aplicarPorcoesBase(bases);
      return;
    }

    forkJoin(faltantes.map((id) => this.foodsService.get(id).pipe(catchError(() => of(null)))))
      .pipe(takeUntil(this.destruido))
      .subscribe((resultados) => {
        for (const food of resultados) {
          if (food) bases.set(food.id, food.qtd);
        }
        this.aplicarPorcoesBase(bases);
      });
  }

  private aplicarPorcoesBase(bases: Map<number, number>): void {
    this.itens.update((itens) =>
      itens.map((item) => ({ ...item, porcaoBase: bases.get(item.foodId) })),
    );
  }

  /** Melhor refeição de um plano pra fase atual: nome batendo primeiro,
   * horário mais próximo como critério de desempate. */
  private refeicaoMaisProxima(plano: MealPlan | null): MealPlanMeal | null {
    if (!plano?.meals.length) return null;

    const alvo = this.normalizar(this.meal().descricao);
    const exata = plano.meals.find((refeicao) => {
      const nome = this.normalizar(refeicao.descricao);
      return nome.includes(alvo) || alvo.includes(nome);
    });
    if (exata) return exata;

    const horaAlvo = this.minutos(this.meal().horario);
    return (
      [...plano.meals].sort(
        (a, b) =>
          Math.abs(this.minutos(a.horario) - horaAlvo) -
          Math.abs(this.minutos(b.horario) - horaAlvo),
      )[0] ?? null
    );
  }

  private normalizar(valor: string): string {
    return valor
      .toLocaleLowerCase('pt-BR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private minutos(valor: string): number {
    const [hora, minuto] = valor.split(':').map(Number);
    return (hora || 0) * 60 + (minuto || 0);
  }
}
