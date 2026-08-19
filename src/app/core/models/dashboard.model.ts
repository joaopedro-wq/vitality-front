import type { DiaryMacros } from './diary.model';

export interface DashboardHoje {
  consumido: DiaryMacros;
  meta: { caloria: number; proteina: number; carbo: number; gordura: number } | null;
  /** 0–150, já clampado no backend (100 = bateu a meta exatamente). */
  percentual: number;
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

/** Uma missão do mini-jogo de constância (`MissionCatalog` no backend) — nunca é sobre
 * calorias/macros, só sobre o hábito de registrar. `progresso` é 0–100 mesmo pras já concluídas
 * (fica em 100). */
export interface DashboardMissao {
  codigo: string;
  icone: string;
  titulo: string;
  xp: number;
  concluida: boolean;
  progresso: number;
}

/** Nível/XP do usuário no mini-jogo de constância — substitui o streak cru. Nunca deriva de
 * meta_calorias/macros; é só sobre hábito de registrar refeição. */
export interface DashboardProgressao {
  nivel: number;
  xp: number;
  xp_proximo_nivel: number;
  progresso_percent: number;
  diarias: DashboardMissao[];
  semanais: DashboardMissao[];
  marcos: DashboardMissao[];
}

export interface DashboardResumo {
  date: string;
  hoje: DashboardHoje;
  semana: DashboardSemanaDia[];
  proxima_refeicao: DashboardProximaRefeicao | null;
  plano_ativo: DashboardPlanoAtivo | null;
  mais_consumidos: DashboardAlimentoConsumido[];
  progressao: DashboardProgressao;
}
