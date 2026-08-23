export type AdminUserEngagement = 'novo' | 'em_ativacao' | 'engajado' | 'inativo';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  created_at: string;
  last_action_at: string | null;
  active_days: number;
  diary_entries_count: number;
  plans_count: number;
  engagement_status: AdminUserEngagement;
}

export interface AdminUsersPage {
  data: AdminUser[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    period: { from: string; to: string };
    summary: {
      total_users: number;
      new_users: number;
      engaged_users: number;
      inactive_users: number;
    };
  };
}

export interface AdminUserDetail extends AdminUser {
  recent_diary_entries: {
    id: number;
    consumed_at: string | null;
    created_at: string;
    descricao_refeicao_snapshot: string | null;
  }[];
  recent_meal_plans: { id: number; titulo: string; created_at: string; updated_at: string }[];
}
