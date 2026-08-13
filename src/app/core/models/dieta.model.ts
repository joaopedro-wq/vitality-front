import type { AlimentoComQtd } from './alimento.model';
import type { NutrientesTotais } from './nutrientes.model';

/** Plano de dieta reutilizável (diferente do diário/Registro do dia). */
export interface Dieta {
  id: number;
  descricao: string;
  id_refeicao: number;
  id_usuario: number;
  alimentos: Array<{
    descricao: string;
    qtd: number;
    proteina: number;
    gordura: number;
    caloria: number;
    carbo: number;
  }>;
  total_proteina: number;
  total_gordura: number;
  total_caloria: number;
  total_carbo: number;
  totalQtd: number;
}

export interface CreateDietaPayload {
  descricao: string;
  id_refeicao: number;
  alimentos: AlimentoComQtd[];
}

export type UpdateDietaPayload = Partial<CreateDietaPayload>;

// Alias local para manter o tipo de retorno agregado disponível caso o backend
// venha a padronizar a resposta para `nutrientes_totais` no futuro (hoje vem
// como campos soltos `total_*`, ver acima).
export type DietaNutrientesTotais = Pick<
  NutrientesTotais,
  'proteina' | 'gordura' | 'caloria' | 'carbo'
>;
