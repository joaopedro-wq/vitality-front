import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TableModule, type TableLazyLoadEvent } from 'primeng/table';

import { PlateLoaderComponent } from '../../atoms/plate-loader/plate-loader.component';

export interface DataTableColumn<T> {
  field: string;
  header: string;
  sortable?: boolean;
  align?: 'start' | 'end';
  secondary?: boolean;
  decimals?: number;
  width?: string;
  frozen?: boolean;
  multiline?: boolean;
  badge?: (row: T) => string;
  value?: (row: T) => string | number | null | undefined;
}

@Component({
  selector: 'vtp-data-table',
  standalone: true,
  imports: [TableModule, PlateLoaderComponent],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
  host: { class: 'block', '[attr.aria-busy]': 'loading() ? true : null' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent<T extends object = Record<string, unknown>> {
  readonly value = input.required<T[]>();
  readonly cols = input.required<DataTableColumn<T>[]>();
  readonly loading = input(false);
  readonly sortField = input<string | null>(null);
  readonly sortOrder = input<number>(1);
  readonly dataKey = input('id');

  readonly stateKey = input<string | undefined>(undefined);

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
