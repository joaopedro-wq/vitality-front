export type ChallengeType = 'weekly' | 'monthly' | 'all_time' | 'custom';

export interface GroupSelfStats {
  nivel: number;
  xp_proximo_nivel: number;
  progresso_percent: number;
  xp_total: number;
  xp_periodo: number;
}

export interface Group {
  id: number;
  name: string;
  invite_code: string;
  owner_id: number | null;
  challenge_type: ChallengeType;
  challenge_starts_at: string | null;
  challenge_ends_at: string | null;
  is_global: boolean;
  members_count?: number;
  voce?: GroupSelfStats;
  members_preview?: { id: number; name: string; avatar: string | null }[];
}

export interface CreateGroupPayload {
  name: string;
  challenge_type: ChallengeType;
  challenge_starts_at?: string;
  challenge_ends_at?: string;
}

export interface GroupRankingEntry {
  user: { id: number; name: string; avatar: string | null };
  nivel: number;
  xp_proximo_nivel: number;
  progresso_percent: number;
  xp_periodo: number;
  xp_total: number;
}

export interface GroupActivityItem {
  user: { id: number; name: string; avatar: string | null };
  titulo: string;
  marco: boolean;
  xp: number;
  completed_at: string;
}
