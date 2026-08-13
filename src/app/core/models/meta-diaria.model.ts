export interface MetaDiaria {
  id: number;
  data: string | null;
  meta_calorias: number;
  meta_proteinas: number;
  meta_carboidratos: number;
  meta_gorduras: number;
  id_usuario: number;
}

export type CreateMetaDiariaPayload = Omit<MetaDiaria, 'id' | 'id_usuario'>;
export type UpdateMetaDiariaPayload = Partial<CreateMetaDiariaPayload>;
