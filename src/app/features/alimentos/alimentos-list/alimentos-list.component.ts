import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BdButtonComponent, BdPaginationComponent, type BdPageEvent } from 'bandeira-ui';
import {
  LucideHeart,
  LucideLayoutGrid,
  LucideSearch,
  LucideShieldCheck,
  LucideTable,
} from '@lucide/angular';
import { ToastrService } from 'ngx-toastr';
import type { TableLazyLoadEvent } from 'primeng/table';
import { Subject, debounceTime, finalize } from 'rxjs';

import { AutoGridComponent } from '../../../components/molecules/auto-grid/auto-grid.component';
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
    RouterLink,
    BdButtonComponent,
    BdPaginationComponent,
    AutoGridComponent,
    DataTableComponent,
    LucideHeart,
    LucideSearch,
    LucideShieldCheck,
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
  private readonly caloriaRangeChange$ = new Subject<[number, number]>();

  protected readonly tab = signal<'all' | 'favorites'>('all');
  protected readonly busca = signal('');
  protected readonly viewMode = signal<'cards' | 'tabela'>('cards');
  protected readonly viewModeOptions = VIEW_MODE_OPTIONS;

  protected readonly grupos = signal<AlimentoGrupo[]>([]);
  protected readonly grupoLoading = signal(true);
  protected readonly grupoSelecionado = signal<string[]>([]);
  protected readonly caloriaBounds = CALORIA_BOUNDS;
  protected readonly caloriaRange = signal<[number, number]>(CALORIA_BOUNDS);

  protected readonly alimentos = signal<Alimento[]>([]);
  protected readonly carregando = signal(true);
  protected readonly pagina = signal(1);
  protected readonly ultimaPagina = signal(1);
  protected readonly totalRegistros = signal(0);
  protected readonly detalhe = signal<Alimento | null>(null);
  protected readonly vazio = computed(() => !this.carregando() && this.alimentos().length === 0);

  protected readonly sortField = signal<string | null>(null);
  protected readonly sortOrder = signal<number>(1);
  protected readonly tableColumns = TABLE_COLUMNS;
  // Escopado por usuário — cada conta guarda seu próprio ajuste de largura de
  // coluna; sem usuário carregado ainda, undefined desliga a persistência.
  protected readonly tableStateKey = computed(() => {
    const userId = this.auth.currentUser()?.id;
    return userId ? `vtp-alimentos-table-cols-${userId}` : undefined;
  });

  constructor() {
    this.loadGrupos();
    this.load();
    this.caloriaRangeChange$.pipe(debounceTime(300)).subscribe((range) => {
      this.caloriaRange.set(range);
      this.pagina.set(1);
      this.load();
    });
  }

  selecionarTab(tab: 'all' | 'favorites'): void {
    this.tab.set(tab);
    this.pagina.set(1);
    this.load();
  }

  buscar(value: string): void {
    this.busca.set(value);
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

  onGrupoChange(grupos: string[]): void {
    this.grupoSelecionado.set(grupos);
    this.pagina.set(1);
    this.load();
  }

  onCaloriaRangeChange(range: [number, number]): void {
    this.caloriaRangeChange$.next(range);
  }

  limparFiltros(): void {
    this.grupoSelecionado.set([]);
    this.caloriaRange.set(CALORIA_BOUNDS);
    this.pagina.set(1);
    this.load();
  }

  fonteLabel(food: Alimento): string {
    return food.fonte === 'taco' ? 'TACO' : food.fonte === 'usda' ? 'USDA' : 'Manual';
  }

  alternarFavorito(food: Alimento): void {
    const anterior = food.is_favorite;
    this.alimentos.update((items) =>
      items.map((item) => (item.id === food.id ? { ...item, is_favorite: !anterior } : item)),
    );
    const onError = () => {
      this.alimentos.update((items) =>
        items.map((item) => (item.id === food.id ? { ...item, is_favorite: anterior } : item)),
      );
      this.toastr.error('Não foi possível atualizar seus favoritos.');
    };
    if (anterior) this.alimentosService.unfavorite(food.id).subscribe({ error: onError });
    else this.alimentosService.favorite(food.id).subscribe({ error: onError });
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const campo = Array.isArray(event.sortField) ? event.sortField[0] : event.sortField;
    this.sortField.set(campo ?? null);
    this.sortOrder.set(event.sortOrder ?? 1);
    this.pagina.set(1);
    this.load();
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
    const [boundMin, boundMax] = CALORIA_BOUNDS;
    this.alimentosService
      .list({
        tab: this.tab(),
        search: this.busca(),
        page: this.pagina(),
        grupo: this.grupoSelecionado().length ? this.grupoSelecionado() : undefined,
        caloria_min: caloriaMin !== boundMin ? caloriaMin : undefined,
        caloria_max: caloriaMax !== boundMax ? caloriaMax : undefined,
        sort_field: (this.sortField() as FoodFilters['sort_field']) ?? undefined,
        sort_order: this.sortField() ? (this.sortOrder() === -1 ? 'desc' : 'asc') : undefined,
      })
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: (response) => {
          this.alimentos.set(response.data);
          this.ultimaPagina.set(response.meta.last_page);
          this.totalRegistros.set(response.meta.total);
        },
        error: () => this.toastr.error('Não foi possível carregar o catálogo agora.'),
      });
  }
}
