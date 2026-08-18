export type FonteAlimento = 'taco' | 'manual' | 'legado' | 'usda';
export type StatusAlimento = 'ativo' | 'pendente' | 'arquivado';

export interface Alimento {
  id: number;
  descricao: string;
  detalhe_exibicao: string | null;
  descricao_original: string;
  proteina: number;
  gordura: number;
  carbo: number;
  caloria: number;
  qtd: number;
  fonte: FonteAlimento;
  source_reference: string | null;
  grupo: string | null;
  illustration_key: string | null;
  status: StatusAlimento;
  is_favorite: boolean;
  image_url: string | null;
  updated_at: string | null;
  plan_tags?: Array<{ slug: string; label: string }>;
  restrictions?: FoodRestriction[];
  nutrientes?: NutrienteAlimento[];
}

export interface NutrienteAlimento {
  codigo: string;
  nome: string;
  unidade: string;
  categoria: 'macro' | 'mineral' | 'vitamina' | 'lipidio' | 'outro';
  valor: number;
  tipo_dado: string | null;
}

export interface FoodPage {
  data: Alimento[];
  meta: { current_page: number; last_page: number; total: number };
}

export interface AlimentoGrupo {
  id: string;
  label: string;
  total: number;
}

export interface FoodPlanTag {
  id: number;
  slug: string;
  label: string;
}

export interface FoodRestriction {
  slug: string;
  label: string;
  type: 'diet' | 'intolerance' | 'allergy';
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
