export type FonteAlimento = 'taco' | 'manual' | 'legado';
export type StatusAlimento = 'ativo' | 'pendente' | 'arquivado';

export interface Alimento {
  id: number;
  descricao: string;
  proteina: number;
  gordura: number;
  carbo: number;
  caloria: number;
  qtd: number;
  fonte: FonteAlimento;
  source_reference: string | null;
  grupo: string | null;
  status: StatusAlimento;
  is_favorite: boolean;
  updated_at: string | null;
}

export interface FoodPage {
  data: Alimento[];
  meta: { current_page: number; last_page: number; total: number };
}

export type CreateAlimentoPayload = Pick<
  Alimento,
  'descricao' | 'proteina' | 'gordura' | 'carbo' | 'caloria' | 'qtd' | 'grupo'
>;
export type UpdateAlimentoPayload = CreateAlimentoPayload & { status?: StatusAlimento };

/** Item de alimento com quantidade consumida/planejada — usado em dieta e registro. */
export interface AlimentoComQtd {
  id: number;
  qtd: number;
}
