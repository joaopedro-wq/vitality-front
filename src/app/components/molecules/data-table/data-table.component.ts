import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TableModule, type TableLazyLoadEvent } from 'primeng/table';
import { LucideTrash2 } from '@lucide/angular';

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
  imports: [TableModule, PlateLoaderComponent, LucideTrash2],
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

  /** Mostra uma coluna final fixa com lixeira por linha — `p-table` só suporta célula de
   *  texto puro via `col.value` (ver CLAUDE.md), então a ação vive fora do loop de `cols()`,
   *  como uma coluna própria do componente em vez de mais uma entrada em `DataTableColumn`. */
  readonly deletable = input(false);

  readonly lazyLoad = output<TableLazyLoadEvent>();
  readonly rowClick = output<T>();
  readonly rowDelete = output<T>();

  protected onDeleteClick(event: MouseEvent, row: T): void {
    event.stopPropagation();
    this.rowDelete.emit(row);
  }

  protected displayValue(col: DataTableColumn<T>, row: T): string {
    const raw = col.value ? col.value(row) : (row as Record<string, unknown>)[col.field];
    if (raw === null || raw === undefined || raw === '') return '—';
    if (typeof raw === 'number' && col.decimals !== undefined) return raw.toFixed(col.decimals);
    return String(raw);
  }
}
