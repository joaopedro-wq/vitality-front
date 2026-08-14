export interface DiaryMacros {
  caloria: number;
  proteina: number;
  carbo: number;
  gordura: number;
  quantidade?: number;
}

export interface DiaryNutrient {
  codigo: string;
  nome: string;
  unidade: string;
  valor: number;
}

export interface DiaryEntryItem {
  food_id: number;
  descricao: string;
  illustration_key: string | null;
  image_url: string | null;
  quantity: number;
  macros: DiaryMacros;
  nutrientes: DiaryNutrient[];
}

export interface DiaryMealRef {
  id: number;
  descricao: string;
  horario: string;
}

export interface DiaryEntry {
  id: number;
  date: string;
  consumed_at: string;
  meal: DiaryMealRef;
  items: DiaryEntryItem[];
  totals: DiaryMacros;
  created_at: string;
  updated_at: string;
}

export interface DiaryDay {
  date: string;
  entries: DiaryEntry[];
  totals: DiaryMacros;
}

export interface DiaryMeal {
  id: number;
  descricao: string;
  horario: string;
  ordem: number;
  is_default: boolean;
  archived_at: string | null;
}

export interface SaveDiaryEntryPayload {
  meal_id: number;
  consumed_at: string;
  items: Array<{ food_id: number; quantity: number }>;
}

export interface SaveDiaryMealPayload {
  descricao: string;
  horario: string;
  ordem?: number;
}
