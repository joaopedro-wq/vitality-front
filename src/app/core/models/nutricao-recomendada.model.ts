/** Recomendação calculada (GET/TMB/macros) — no máximo 1 registro por usuário. */
export interface NutricaoRecomendada {
  id: number;
  /** Gasto Energético Total. */
  get: number;
  /** Taxa Metabólica Basal. */
  tmb: number;
  caloria: number;
  proteina: number;
  carbo: number;
  gordura: number;
  id_usuario: number;
}

export type CreateNutricaoRecomendadaPayload = Omit<NutricaoRecomendada, 'id' | 'id_usuario'>;
export type UpdateNutricaoRecomendadaPayload = Partial<CreateNutricaoRecomendadaPayload>;
