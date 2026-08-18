import type { SortOption } from '../molecules/sort-control/sort-control.component';
import type { Alimento } from '../../core/models/alimento.model';
import type { FoodFilters } from '../../services/alimento.service';

export type FoodSortField = NonNullable<FoodFilters['sort_field']>;

export const FOOD_SORT_OPTIONS: readonly SortOption<FoodSortField>[] = [
  { field: 'descricao', label: 'Nome' },
  { field: 'caloria', label: 'Calorias' },
  { field: 'proteina', label: 'Proteína' },
  { field: 'carbo', label: 'Carboidratos' },
  { field: 'gordura', label: 'Gorduras' },
];

export function direcaoOrdenacaoLabel(campo: FoodSortField, ordem: 1 | -1): string {
  if (campo === 'descricao') return ordem === 1 ? 'A–Z' : 'Z–A';
  return ordem === 1 ? 'Menor para maior' : 'Maior para menor';
}

export function compararAlimentos(
  a: Alimento,
  b: Alimento,
  campo: FoodSortField,
  ordem: 1 | -1,
): number {
  if (campo === 'descricao' || campo === 'grupo') {
    return ordem * (a[campo] ?? '').localeCompare(b[campo] ?? '', 'pt-BR');
  }
  return ordem * ((a[campo] ?? 0) - (b[campo] ?? 0));
}
