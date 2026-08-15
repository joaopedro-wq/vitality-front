import type { DiaryMacros } from './diary.model';

export type MealPlanStyle = 'rapido' | 'caseiro' | 'economico';
export type MealPlanDietType = 'onivora' | 'vegetariana' | 'vegana';

export interface FoodRestrictionOption {
  slug: string;
  label: string;
  type: 'diet' | 'intolerance' | 'allergy';
}

export interface MealPlanPreferences {
  meal_count: 3 | 4 | 5;
  meal_times: string[];
  style: MealPlanStyle;
  excluded_food_ids: number[];
  diet_type: MealPlanDietType;
  restriction_slugs: string[];
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
  explanation?: string;
}

export interface MealPlanDraft {
  draft_id: string;
  preferences: MealPlanPreferences;
  target: DiaryMacros;
  totals: DiaryMacros;
  within_target: boolean;
  warning: string | null;
  summary?: string;
  meals: MealPlanMeal[];
}

export interface MealPlan extends Omit<MealPlanDraft, 'draft_id'> {
  id: number;
  titulo: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMealPlanPayload {
  titulo: string;
  draft_id: string;
}
