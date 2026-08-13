/**
 * `id_usuario === null` marca alimentos globais (tabela TACO pré-carregada,
 * vêm junto no `index` de qualquer usuário) — read-only na UI.
 */
export interface Alimento {
  id: number;
  descricao: string;
  proteina: number;
  gordura: number;
  carbo: number;
  caloria: number;
  /** Quantidade base sobre a qual os valores acima são calculados (ex.: 100g). */
  qtd: number;
  id_usuario: number | null;
}

export type CreateAlimentoPayload = Pick<
  Alimento,
  'descricao' | 'proteina' | 'gordura' | 'carbo' | 'caloria' | 'qtd'
>;

export type UpdateAlimentoPayload = Partial<CreateAlimentoPayload>;

/** Item de alimento com quantidade consumida/planejada — usado em dieta e registro. */
export interface AlimentoComQtd {
  id: number;
  qtd: number;
}
