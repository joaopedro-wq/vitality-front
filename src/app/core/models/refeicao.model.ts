/** Tipo de refeição (ex.: "Café da manhã", horário 08:00:00) — não confundir com Registro. */
export interface Refeicao {
  id: number;
  descricao: string;
  horario: string;
  id_usuario: number;
}

export type CreateRefeicaoPayload = Pick<Refeicao, 'descricao' | 'horario'>;
export type UpdateRefeicaoPayload = Partial<CreateRefeicaoPayload>;
