export type Genero = 'M' | 'F' | 'O';

export type NivelAtividade = 'sedentario' | 'leve' | 'moderado' | 'intenso' | 'muito_intenso';

export type Objetivo = 'emagrecer' | 'manter' | 'ganhar_massa';
export type OnboardingStatus = 'pending' | 'completed' | 'skipped';

export interface User {
  id: number;
  name: string;
  email: string;
  data_nascimento: string | null;
  genero: Genero | null;
  peso: number | null;
  altura: number | null;
  avatar: string | null;
  nivel_atividade: NivelAtividade | null;
  objetivo: Objetivo | null;
  is_admin: boolean;
  onboarding_status: OnboardingStatus;
  onboarding_finished_at: string | null;
}

/** Payload de `PUT /api/user/{id}` — todos os campos opcionais (update parcial). */
export type UpdateUserPayload = Partial<
  Pick<
    User,
    | 'name'
    | 'email'
    | 'data_nascimento'
    | 'genero'
    | 'peso'
    | 'altura'
    | 'nivel_atividade'
    | 'objetivo'
  >
> & { password?: string };
