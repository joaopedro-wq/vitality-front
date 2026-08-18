import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { apiPaths } from '../core/http/api-paths';
import type { ApiResponse } from '../core/models/api-response.model';
import type {
  CreateMealPlanPayload,
  MealPlan,
  MealPlanDraft,
  MealPlanPreferences,
  FoodRestrictionOption,
  MealPlanItemSuggestion,
} from '../core/models/meal-plan.model';

@Injectable({ providedIn: 'root' })
export class MealPlanService {
  private readonly http = inject(HttpClient);

  list(): Observable<MealPlan[]> {
    return this.http
      .get<ApiResponse<MealPlan[]>>(apiPaths.mealPlans())
      .pipe(map((res) => res.data));
  }

  preview(preferences: MealPlanPreferences): Observable<MealPlanDraft> {
    return this.http
      .post<ApiResponse<MealPlanDraft>>(apiPaths.mealPlanPreview(), preferences)
      .pipe(map((res) => res.data));
  }

  regenerateMeal(draftId: string, position: number): Observable<MealPlanDraft> {
    return this.http
      .post<ApiResponse<MealPlanDraft>>(apiPaths.mealPlanMealPreview(position), {
        draft_id: draftId,
      })
      .pipe(map((res) => res.data));
  }

  itemSuggestions(
    draftId: string,
    position: number,
    foodId: number,
  ): Observable<MealPlanItemSuggestion[]> {
    return this.http
      .post<
        ApiResponse<MealPlanItemSuggestion[]>
      >(apiPaths.mealPlanItemSuggestions(position, foodId), { draft_id: draftId })
      .pipe(map((res) => res.data));
  }

  replaceItem(
    draftId: string,
    position: number,
    foodId: number,
    replacementFoodId: number,
    quantity: number,
  ): Observable<MealPlanDraft> {
    return this.http
      .post<
        ApiResponse<MealPlanDraft>
      >(apiPaths.mealPlanItemReplace(position, foodId), { draft_id: draftId, replacement_food_id: replacementFoodId, quantity })
      .pipe(map((res) => res.data));
  }

  undo(draftId: string): Observable<MealPlanDraft> {
    return this.http
      .post<ApiResponse<MealPlanDraft>>(apiPaths.mealPlanUndo(), { draft_id: draftId })
      .pipe(map((res) => res.data));
  }

  refreshLocale(draftId: string): Observable<MealPlanDraft> {
    return this.http
      .post<ApiResponse<MealPlanDraft>>(apiPaths.mealPlanRefreshLocale(), { draft_id: draftId })
      .pipe(map((res) => res.data));
  }

  recreate(draftId: string): Observable<MealPlanDraft> {
    return this.http
      .post<ApiResponse<MealPlanDraft>>(apiPaths.mealPlanRecreate(), { draft_id: draftId })
      .pipe(map((res) => res.data));
  }

  editDraft(id: number): Observable<MealPlanDraft> {
    return this.http
      .post<ApiResponse<MealPlanDraft>>(apiPaths.mealPlanEditDraft(id), {})
      .pipe(map((res) => res.data));
  }

  save(payload: CreateMealPlanPayload): Observable<MealPlan> {
    return this.http
      .post<ApiResponse<MealPlan>>(apiPaths.mealPlans(), {
        titulo: payload.titulo,
        draft_id: payload.draft_id,
      })
      .pipe(map((res) => res.data));
  }

  update(id: number, payload: CreateMealPlanPayload): Observable<MealPlan> {
    return this.http
      .put<ApiResponse<MealPlan>>(apiPaths.mealPlan(id), {
        titulo: payload.titulo,
        draft_id: payload.draft_id,
      })
      .pipe(map((res) => res.data));
  }

  profile(): Observable<MealPlanPreferences> {
    return this.http
      .get<ApiResponse<MealPlanPreferences>>(apiPaths.mealPlanProfile())
      .pipe(map((res) => res.data));
  }

  saveProfile(profile: MealPlanPreferences): Observable<MealPlanPreferences> {
    return this.http
      .put<ApiResponse<MealPlanPreferences>>(apiPaths.mealPlanProfile(), profile)
      .pipe(map((res) => res.data));
  }

  restrictions(): Observable<FoodRestrictionOption[]> {
    return this.http
      .get<ApiResponse<FoodRestrictionOption[]>>(apiPaths.mealPlanRestrictions())
      .pipe(map((res) => res.data));
  }

  archive(id: number): Observable<void> {
    return this.http.post<void>(apiPaths.mealPlanArchive(id), {});
  }
}
