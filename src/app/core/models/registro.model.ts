import type { AlimentoComQtd } from './alimento.model';
import type { NutrientesTotais } from './nutrientes.model';

/** Item de alimento consumido dentro de um registro, já com o alimento embutido. */
export interface RegistroAlimento {
  descricao: string;
  qtd: number;
  proteina: number;
  gordura: number;
  caloria: number;
  carbo: number;
  alimento: {
    id: number;
    descricao: string;
    qtd: number;
  };
}

/** Registro = o que foi de fato consumido numa data/refeição (o "diário alimentar"). */
export interface Registro {
  id: number;
  data: string;
  descricao_refeicao: string;
  alimentos: RegistroAlimento[];
  nutrientes_totais: NutrientesTotais;
}

export interface CreateRegistroPayload {
  data: string;
  id_refeicao: number;
  alimentos: AlimentoComQtd[];
}

export type UpdateRegistroPayload = Partial<CreateRegistroPayload>;
