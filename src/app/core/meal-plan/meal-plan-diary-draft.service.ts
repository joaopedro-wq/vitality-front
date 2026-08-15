import { Injectable, signal } from '@angular/core';

import type { MealPlanItem } from '../models/meal-plan.model';

interface DiaryDraft {
  mealId: number;
  items: MealPlanItem[];
}

/** Rascunho efêmero: um plano só chega ao diário após a confirmação do usuário. */
@Injectable({ providedIn: 'root' })
export class MealPlanDiaryDraftService {
  private readonly draftSignal = signal<DiaryDraft | null>(null);

  prepare(mealId: number, items: MealPlanItem[]): void {
    this.draftSignal.set({ mealId, items });
  }

  takeFor(mealId: number): DiaryDraft | null {
    const draft = this.draftSignal();
    if (!draft || (draft.mealId !== 0 && draft.mealId !== mealId)) return null;
    this.draftSignal.set(null);
    return draft;
  }
}
