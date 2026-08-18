import { DecimalPipe, DOCUMENT, UpperCasePipe } from '@angular/common';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BdButtonComponent } from 'bandeira-ui';
import {
  LucideFilter,
  LucideHeart,
  LucideLayoutGrid,
  LucideSearch,
  LucideShieldCheck,
  LucideTable,
  LucideX,
} from '@lucide/angular';
import { ToastrService } from 'ngx-toastr';
import type { TableLazyLoadEvent } from 'primeng/table';
import { Subject, debounceTime, finalize, skip } from 'rxjs';

import {
  DataTableComponent,
  type DataTableColumn,
} from '../../../components/molecules/data-table/data-table.component';
import { FoodTileComponent } from '../../../components/molecules/food-tile/food-tile.component';
import { PlateLoaderComponent } from '../../../components/atoms/plate-loader/plate-loader.component';
import { BackButtonComponent } from '../../../components/molecules/back-button/back-button.component';
import { LoadingStateComponent } from '../../../components/molecules/loading-state/loading-state.component';
import { PageTitleComponent } from '../../../components/molecules/page-title/page-title.component';
import { PaginationControlsComponent } from '../../../components/molecules/pagination-controls/pagination-controls.component';
import { SortControlComponent } from '../../../components/molecules/sort-control/sort-control.component';
import { gateCarregamento } from '../../../components/utils/loading-gate.util';
import {
  FOOD_SORT_OPTIONS,
  direcaoOrdenacaoLabel,
  type FoodSortField,
} from '../../../components/utils/food-sort-options.util';
import {
  ViewModeToggleComponent,
  type ViewModeOption,
} from '../../../components/molecules/view-mode-toggle/view-mode-toggle.component';
import { AuthService } from '../../../core/auth/auth.service';
import type { Alimento, AlimentoGrupo } from '../../../core/models/alimento.model';
import { AlimentoService, type FoodFilters } from '../../../services/alimento.service';
import { AlimentosFiltrosComponent } from '../alimentos-filtros/alimentos-filtros.component';

const CALORIA_BOUNDS: [number, number] = [0, 900];
const PAGE_SIZE = 20;
const VIEW_MODE_OPTIONS: ViewModeOption[] = [
  { value: 'cards', label: 'Cards', icon: LucideLayoutGrid },
  { value: 'tabela', label: 'Tabela', icon: LucideTable },
];
const TABLE_COLUMNS: DataTableColumn<Alimento>[] = [
  { field: 'descricao', header: 'Alimento', width: '260px', frozen: true },
  {
    field: 'grupo',
    header: 'Grupo',
    secondary: true,
    width: '180px',
    value: (row) => row.grupo || 'Catálogo geral',
  },
  { field: 'caloria', header: 'Kcal', align: 'end', decimals: 0, width: '110px' },
  {
    field: 'proteina',
    header: 'Prot. (g)',
    align: 'end',
    decimals: 1,
    secondary: true,
    width: '110px',
  },
  {
    field: 'carbo',
    header: 'Carbo (g)',
    align: 'end',
    decimals: 1,
    secondary: true,
    width: '110px',
  },
  {
    field: 'gordura',
    header: 'Gord. (g)',
    align: 'end',
    decimals: 1,
    secondary: true,
    width: '110px',
  },
];

@Component({
  selector: 'vtp-alimentos-list',
  standalone: true,
  imports: [
    CdkTrapFocus,
    DecimalPipe,
    UpperCasePipe,
    RouterLink,
    BdButtonComponent,
    DataTableComponent,
    LucideFilter,
    LucideHeart,
    LucideSearch,
    LucideShieldCheck,
    LucideX,
    FoodTileComponent,
    ViewModeToggleComponent,
    AlimentosFiltrosComponent,
    PlateLoaderComponent,
    BackButtonComponent,
    LoadingStateComponent,
    PageTitleComponent,
    PaginationControlsComponent,
    SortControlComponent,
  ],
  templateUrl: './alimentos-list.component.html',
  styleUrl: './alimentos-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlimentosListComponent {
  private readonly alimentosService = inject(AlimentoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  protected readonly auth = inject(AuthService);
  private readonly toastr = inject(ToastrService);
  private readonly buscaChange$ = new Subject<string>();
  private readonly caloriaRangeChange$ = new Subject<[number, number]>();

  protected readonly tab = signal<'all' | 'favorites'>('all');
  protected readonly busca = signal('');
  protected readonly viewMode = signal<'cards' | 'tabela'>('cards');
  protected readonly viewModeOptions = VIEW_MODE_OPTIONS;
  protected readonly filtrosAbertos = signal(false);

  protected readonly grupos = signal<AlimentoGrupo[]>([]);
  protected readonly grupoSelecionado = signal<string[]>([]);
  protected readonly grupoLoading = signal(true);
  protected readonly caloriaBounds = CALORIA_BOUNDS;
  protected readonly caloriaRange = signal<[number, number]>(CALORIA_BOUNDS);
  protected readonly filtrosAtivos = computed(() => {
    const [min, max] = this.caloriaRange();
    return (
      Number(this.tab() === 'favorites') +
      this.grupoSelecionado().length +
      Number(min !== CALORIA_BOUNDS[0] || max !== CALORIA_BOUNDS[1])
    );
  });

  protected readonly alimentos = signal<Alimento[]>([]);
  protected readonly carregando = signal(true);
  /**
   * Primeira carga (ainda sem nada na tela) mostra o prato no lugar da lista.
   * Recarga (paginar, filtrar, ordenar) mantém os resultados no lugar e só os
   * esmaece — trocar uma lista cheia por um loader é pior que esperar sobre ela.
   */
  protected readonly primeiraCargaVisivel = gateCarregamento(
    computed(() => this.carregando() && this.alimentos().length === 0),
  );
  protected readonly recarregando = computed(
    () => this.carregando() && this.alimentos().length > 0,
  );
  protected readonly pagina = signal(1);
  protected readonly totalRegistros = signal(0);
  protected readonly vazio = computed(() => !this.carregando() && this.alimentos().length === 0);
  protected readonly totalPaginas = computed(() => Math.ceil(this.totalRegistros() / PAGE_SIZE));

  protected readonly detalhe = signal<Alimento | null>(null);
  protected readonly detalheCarregando = signal(false);
  protected readonly detalheCarregandoVisivel = gateCarregamento(this.detalheCarregando);
  protected readonly detalheImagemComErro = signal(false);

  protected readonly sortField = signal<FoodSortField>('descricao');
  protected readonly sortOrder = signal<1 | -1>(1);
  protected readonly sortOptions = FOOD_SORT_OPTIONS;
  protected readonly direcaoOrdenacao = computed(() =>
    direcaoOrdenacaoLabel(this.sortField(), this.sortOrder()),
  );
  protected readonly tableColumns = TABLE_COLUMNS;
  protected readonly tableStateKey = computed(() => {
    const userId = this.auth.currentUser()?.id;
    return userId ? `vtp-alimentos-table-cols-${userId}` : undefined;
  });

  constructor() {
    const paginaUrl = Number(this.route.snapshot.queryParamMap.get('page'));
    if (Number.isInteger(paginaUrl) && paginaUrl > 1) this.pagina.set(paginaUrl);

    this.loadGrupos();
    this.load();
    this.route.queryParamMap.pipe(skip(1)).subscribe((params) => {
      const paginaUrl = Number(params.get('page'));
      const proximaPagina = Number.isInteger(paginaUrl) && paginaUrl > 1 ? paginaUrl : 1;
      if (proximaPagina === this.pagina()) return;
      this.pagina.set(proximaPagina);
      this.rolarParaResultados();
      this.load();
    });
    this.buscaChange$.pipe(debounceTime(300)).subscribe((busca) => {
      this.busca.set(busca);
      this.reiniciarPaginacao();
      this.load();
    });
    this.caloriaRangeChange$.pipe(debounceTime(300)).subscribe((range) => {
      this.caloriaRange.set(range);
      this.reiniciarPaginacao();
      this.load();
    });
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.detalhe()) this.fecharDetalhe();
    else if (this.filtrosAbertos()) this.fecharFiltros();
  }

  atualizarBusca(value: string): void {
    this.buscaChange$.next(value);
  }

  selecionarTab(tab: 'all' | 'favorites'): void {
    this.tab.set(tab);
    this.reiniciarPaginacao();
    this.load();
  }

  selecionarOrdenacao(field: FoodSortField): void {
    this.sortField.set(field);
    this.reiniciarPaginacao();
    this.load();
  }

  definirOrdem(ordem: 1 | -1): void {
    this.sortOrder.set(ordem);
    this.reiniciarPaginacao();
    this.load();
  }

  onGrupoChange(grupos: string[]): void {
    this.grupoSelecionado.set(grupos);
    this.reiniciarPaginacao();
    this.load();
  }

  onSomenteFavoritosChange(somenteFavoritos: boolean): void {
    this.selecionarTab(somenteFavoritos ? 'favorites' : 'all');
  }

  onCaloriaChange(range: [number, number]): void {
    this.caloriaRangeChange$.next(range);
  }

  abrirFiltros(): void {
    this.filtrosAbertos.set(true);
  }

  fecharFiltros(): void {
    this.filtrosAbertos.set(false);
  }

  limparFiltros(): void {
    this.tab.set('all');
    this.grupoSelecionado.set([]);
    this.caloriaRange.set(CALORIA_BOUNDS);
    this.reiniciarPaginacao();
    this.load();
  }

  irParaPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas() || pagina === this.pagina() || this.carregando())
      return;
    this.pagina.set(pagina);
    this.sincronizarPaginaNaUrl();
    this.rolarParaResultados();
    this.load();
  }

  onViewModeChange(mode: string): void {
    if (mode === 'cards' || mode === 'tabela') this.viewMode.set(mode);
  }

  abrirDetalhe(food: Alimento): void {
    this.detalhe.set(food);
    this.detalheImagemComErro.set(false);
    this.detalheCarregando.set(true);
    this.alimentosService
      .get(food.id)
      .pipe(finalize(() => this.detalheCarregando.set(false)))
      .subscribe({
        next: (detalhe) => this.detalhe.set(detalhe),
        error: () => this.toastr.error('Não foi possível carregar os detalhes deste alimento.'),
      });
  }

  fecharDetalhe(): void {
    this.detalhe.set(null);
  }

  alternarFavorito(food: Alimento): void {
    const anterior = food.is_favorite;
    this.alimentos.update((items) =>
      items.map((item) => (item.id === food.id ? { ...item, is_favorite: !anterior } : item)),
    );
    if (this.detalhe()?.id === food.id)
      this.detalhe.update((item) => (item ? { ...item, is_favorite: !anterior } : item));
    const onError = () => {
      this.alimentos.update((items) =>
        items.map((item) => (item.id === food.id ? { ...item, is_favorite: anterior } : item)),
      );
      if (this.detalhe()?.id === food.id)
        this.detalhe.update((item) => (item ? { ...item, is_favorite: anterior } : item));
      this.toastr.error('Não foi possível atualizar seus favoritos.');
    };
    if (anterior) this.alimentosService.unfavorite(food.id).subscribe({ error: onError });
    else this.alimentosService.favorite(food.id).subscribe({ error: onError });
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const field = Array.isArray(event.sortField) ? event.sortField[0] : event.sortField;
    this.sortField.set((field as FoodFilters['sort_field']) ?? 'descricao');
    this.sortOrder.set(event.sortOrder === -1 ? -1 : 1);
    this.reiniciarPaginacao();
    this.load();
  }

  protected onDetalheImagemErro(): void {
    this.detalheImagemComErro.set(true);
  }

  private reiniciarPaginacao(): void {
    this.pagina.set(1);
    this.sincronizarPaginaNaUrl();
    this.rolarParaResultados();
  }

  private sincronizarPaginaNaUrl(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: this.pagina() > 1 ? this.pagina() : null },
      queryParamsHandling: 'merge',
    });
  }

  private rolarParaResultados(): void {
    requestAnimationFrame(() => {
      this.document
        .getElementById('food-results')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  private loadGrupos(): void {
    this.grupoLoading.set(true);
    // `finalize` em vez de zerar em next/error: se a subscription for cancelada
    // (troca de filtro antes da resposta), nenhum dos dois roda e o loader fica
    // preso para sempre. Padrão do resto do projeto.
    this.alimentosService
      .groups()
      .pipe(finalize(() => this.grupoLoading.set(false)))
      .subscribe({
        next: (grupos) => this.grupos.set(grupos),
        error: () => this.toastr.error('Não foi possível carregar os grupos alimentares.'),
      });
  }

  private load(): void {
    this.carregando.set(true);
    const [caloriaMin, caloriaMax] = this.caloriaRange();
    const caloriaRangeAtivo = caloriaMin !== CALORIA_BOUNDS[0] || caloriaMax !== CALORIA_BOUNDS[1];
    this.alimentosService
      .list({
        tab: this.tab(),
        search: this.busca(),
        page: this.pagina(),
        grupo: this.grupoSelecionado().length ? this.grupoSelecionado() : undefined,
        // A API valida o máximo em relação ao mínimo; portanto, o intervalo precisa
        // seguir completo mesmo quando só uma das pontas foi movimentada.
        caloria_min: caloriaRangeAtivo ? caloriaMin : undefined,
        caloria_max: caloriaRangeAtivo ? caloriaMax : undefined,
        sort_field: this.sortField() ?? undefined,
        sort_order: this.sortOrder() === -1 ? 'desc' : 'asc',
      })
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: (response) => {
          this.alimentos.set(response.data);
          this.totalRegistros.set(response.meta.total);
        },
        error: () => this.toastr.error('Não foi possível carregar o catálogo agora.'),
      });
  }
}
