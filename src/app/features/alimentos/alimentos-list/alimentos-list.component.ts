import { DecimalPipe, UpperCasePipe } from '@angular/common';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { BdButtonComponent, BdPaginationComponent, type BdPageEvent } from 'bandeira-ui';
import {
  LucideArrowDown,
  LucideArrowUp,
  LucideChevronDown,
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
import { Subject, debounceTime, finalize } from 'rxjs';

import {
  DataTableComponent,
  type DataTableColumn,
} from '../../../components/molecules/data-table/data-table.component';
import { FoodTileComponent } from '../../../components/molecules/food-tile/food-tile.component';
import {
  ViewModeToggleComponent,
  type ViewModeOption,
} from '../../../components/molecules/view-mode-toggle/view-mode-toggle.component';
import { AuthService } from '../../../core/auth/auth.service';
import type { Alimento, AlimentoGrupo } from '../../../core/models/alimento.model';
import { AlimentoService, type FoodFilters } from '../../../services/alimento.service';
import { AlimentosFiltrosComponent } from '../alimentos-filtros/alimentos-filtros.component';

const CALORIA_BOUNDS: [number, number] = [0, 900];
type FoodSortField = NonNullable<FoodFilters['sort_field']>;
interface FoodSortOption {
  field: FoodSortField;
  label: string;
}
const FOOD_SORT_OPTIONS: FoodSortOption[] = [
  { field: 'descricao', label: 'Nome' },
  { field: 'caloria', label: 'Calorias' },
  { field: 'proteina', label: 'Proteína' },
  { field: 'carbo', label: 'Carboidratos' },
  { field: 'gordura', label: 'Gorduras' },
];
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
    BdPaginationComponent,
    DataTableComponent,
    LucideArrowDown,
    LucideArrowUp,
    LucideChevronDown,
    LucideFilter,
    LucideHeart,
    LucideSearch,
    LucideShieldCheck,
    LucideX,
    FoodTileComponent,
    ViewModeToggleComponent,
    AlimentosFiltrosComponent,
  ],
  templateUrl: './alimentos-list.component.html',
  styleUrl: './alimentos-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlimentosListComponent {
  private readonly alimentosService = inject(AlimentoService);
  protected readonly auth = inject(AuthService);
  private readonly toastr = inject(ToastrService);
  private readonly buscaChange$ = new Subject<string>();
  private readonly caloriaRangeChange$ = new Subject<[number, number]>();

  protected readonly tab = signal<'all' | 'favorites'>('all');
  protected readonly busca = signal('');
  protected readonly viewMode = signal<'cards' | 'tabela'>('cards');
  protected readonly viewModeOptions = VIEW_MODE_OPTIONS;
  protected readonly filtrosAbertos = signal(false);
  protected readonly ordenacaoAberta = signal(false);

  protected readonly grupos = signal<AlimentoGrupo[]>([]);
  protected readonly grupoSelecionado = signal<string[]>([]);
  protected readonly grupoLoading = signal(true);
  protected readonly caloriaBounds = CALORIA_BOUNDS;
  protected readonly caloriaRange = signal<[number, number]>(CALORIA_BOUNDS);
  protected readonly filtrosAtivos = computed(() => {
    const [min, max] = this.caloriaRange();
    return (
      this.grupoSelecionado().length +
      Number(min !== CALORIA_BOUNDS[0] || max !== CALORIA_BOUNDS[1])
    );
  });

  protected readonly alimentos = signal<Alimento[]>([]);
  protected readonly carregando = signal(true);
  protected readonly pagina = signal(1);
  protected readonly totalRegistros = signal(0);
  protected readonly vazio = computed(() => !this.carregando() && this.alimentos().length === 0);

  protected readonly detalhe = signal<Alimento | null>(null);
  protected readonly detalheCarregando = signal(false);
  protected readonly detalheImagemComErro = signal(false);

  protected readonly sortField = signal<FoodSortField>('descricao');
  protected readonly sortOrder = signal<1 | -1>(1);
  protected readonly sortOptions = FOOD_SORT_OPTIONS;
  protected readonly ordenacaoAtual = computed(
    () =>
      FOOD_SORT_OPTIONS.find((option) => option.field === this.sortField()) ?? FOOD_SORT_OPTIONS[0],
  );
  protected readonly direcaoOrdenacao = computed(() => {
    if (this.sortField() === 'descricao') return this.sortOrder() === 1 ? 'A–Z' : 'Z–A';
    return this.sortOrder() === 1 ? 'Menor para maior' : 'Maior para menor';
  });
  protected readonly tableColumns = TABLE_COLUMNS;
  protected readonly tableStateKey = computed(() => {
    const userId = this.auth.currentUser()?.id;
    return userId ? `vtp-alimentos-table-cols-${userId}` : undefined;
  });

  constructor() {
    this.loadGrupos();
    this.load();
    this.buscaChange$.pipe(debounceTime(300)).subscribe((busca) => {
      this.busca.set(busca);
      this.pagina.set(1);
      this.load();
    });
    this.caloriaRangeChange$.pipe(debounceTime(300)).subscribe((range) => {
      this.caloriaRange.set(range);
      this.pagina.set(1);
      this.load();
    });
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.detalhe()) this.fecharDetalhe();
    else if (this.filtrosAbertos()) this.fecharFiltros();
    else this.fecharOrdenacao();
  }

  atualizarBusca(value: string): void {
    this.buscaChange$.next(value);
  }

  selecionarTab(tab: 'all' | 'favorites'): void {
    this.tab.set(tab);
    this.pagina.set(1);
    this.load();
  }

  toggleOrdenacao(): void {
    this.ordenacaoAberta.update((aberta) => !aberta);
  }

  fecharOrdenacao(): void {
    this.ordenacaoAberta.set(false);
  }

  selecionarOrdenacao(field: FoodSortField): void {
    this.sortField.set(field);
    this.pagina.set(1);
    this.fecharOrdenacao();
    this.load();
  }

  inverterOrdenacao(): void {
    this.sortOrder.update((order) => (order === 1 ? -1 : 1));
    this.pagina.set(1);
    this.load();
  }

  onGrupoChange(grupos: string[]): void {
    this.grupoSelecionado.set(grupos);
    this.pagina.set(1);
    this.load();
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
    this.grupoSelecionado.set([]);
    this.caloriaRange.set(CALORIA_BOUNDS);
    this.pagina.set(1);
    this.load();
  }

  irParaPagina(evento: BdPageEvent): void {
    this.pagina.set(evento.page + 1);
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
    this.pagina.set(1);
    this.load();
  }

  protected onDetalheImagemErro(): void {
    this.detalheImagemComErro.set(true);
  }

  private loadGrupos(): void {
    this.grupoLoading.set(true);
    this.alimentosService.groups().subscribe({
      next: (grupos) => {
        this.grupos.set(grupos);
        this.grupoLoading.set(false);
      },
      error: () => {
        this.grupoLoading.set(false);
        this.toastr.error('Não foi possível carregar os grupos alimentares.');
      },
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
