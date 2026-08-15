import type { DiaryMacros } from './diary.model';

export type MealPlanStyle = 'rapido' | 'caseiro' | 'economico';

export interface MealPlanPreferences {
  meal_count: 3 | 4 | 5;
  meal_times: string[];
  style: MealPlanStyle;
  excluded_food_ids: number[];
}

export interface MealPlanItem {
  id?: number;
  food_id: number;
  descricao: string;
  quantity: number;
  macros: DiaryMacros;
}

export interface MealPlanMeal {
  id?: number;
  position: number;
  descricao: string;
  horario: string;
  target: DiaryMacros;
  totals: DiaryMacros;
  items: MealPlanItem[];
}

export interface MealPlanDraft {
  preferences: MealPlanPreferences;
  target: DiaryMacros;
  totals: DiaryMacros;
  within_target: boolean;
  warning: string | null;
  meals: MealPlanMeal[];
}

export interface MealPlan extends MealPlanDraft {
  id: number;
  titulo: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMealPlanPayload extends MealPlanDraft {
  titulo: string;
}
