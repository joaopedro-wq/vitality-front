import type { DiaryMacros } from './diary.model';

export interface DashboardHoje {
  consumido: DiaryMacros;
  meta: { caloria: number; proteina: number; carbo: number; gordura: number } | null;
  percentual: number;
}

export interface DashboardStreak {

  dias: number;
  recorde: number;
}

export interface DashboardSemanaDia {
  data: string;
  percentual: number;
  dentro_da_meta: boolean;
}

export interface DashboardProximaRefeicao {
  meal_id: number;
  descricao: string;
  horario: string;
  sugestao_plano: string | null;
}

export interface DashboardPlanoRefeicaoStatus {
  meal_plan_meal_id: number;
  descricao: string;
  horario: string;
  registrado: boolean;
}

export interface DashboardPlanoAtivo {
  id: number;
  titulo: string;
  /** 0–100 — aproximação por proximidade de horário (±90min), não vínculo real com o diário. */
  aderencia_7d: number;
  refeicoes_hoje: DashboardPlanoRefeicaoStatus[];
}

export interface DashboardAlimentoConsumido {
  food_id: number;
  descricao: string;
  vezes: number;
}

export interface DashboardBadge {
  codigo: string;
  icone: string;
  titulo: string;
  conquistado: boolean;
  /** 0–100, progresso em direção ao badge — usado tanto no selo quanto na "próxima conquista". */
  progresso: number;
  unlocked_at: string | null;
}

export interface DashboardResumo {
  date: string;
  hoje: DashboardHoje;
  streak: DashboardStreak;
  semana: DashboardSemanaDia[];
  proxima_refeicao: DashboardProximaRefeicao | null;
  plano_ativo: DashboardPlanoAtivo | null;
  mais_consumidos: DashboardAlimentoConsumido[];
  badges: DashboardBadge[];
}
