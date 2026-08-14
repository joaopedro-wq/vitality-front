import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TableModule, type TableLazyLoadEvent } from 'primeng/table';

export interface DataTableColumn<T> {
  /** Chave da coluna — também usada como campo de ordenação (`sort_field`
   * enviado ao backend) e, sem `value`, como acessor (`row[field]`). */
  field: string;
  header: string;
  /** `true` por padrão — a maioria das tabelas do sistema ordena em todos
   * os campos; desligar caso a caso quando não fizer sentido. */
  sortable?: boolean;
  align?: 'start' | 'end';
  /** Some abaixo de 720px — reserva pra colunas acessórias. */
  secondary?: boolean;
  /** Dígitos decimais quando o valor é numérico (`toFixed`). Ignorado se
   * `value` já devolver string pronta. */
  decimals?: number;
  /** Acesso/formatação customizada — sobrepõe `row[field]` cru (ex.: um
   * fallback de texto quando o campo vem vazio). */
  value?: (row: T) => string | number | null | undefined;
}

@Component({
  selector: 'vtp-data-table',
  standalone: true,
  imports: [TableModule],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent<T extends object = Record<string, unknown>> {
  readonly value = input.required<T[]>();
  readonly cols = input.required<DataTableColumn<T>[]>();
  readonly loading = input(false);
  readonly sortField = input<string | null>(null);
  readonly sortOrder = input<number>(1);
  readonly dataKey = input('id');

  readonly lazyLoadOnInit = input(false);

  readonly lazyLoad = output<TableLazyLoadEvent>();
  readonly rowClick = output<T>();

  protected displayValue(col: DataTableColumn<T>, row: T): string {
    const raw = col.value ? col.value(row) : (row as Record<string, unknown>)[col.field];
    if (raw === null || raw === undefined || raw === '') return '—';
    if (typeof raw === 'number' && col.decimals !== undefined) return raw.toFixed(col.decimals);
    return String(raw);
  }
}
