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

  regenerateMeal(
    preferences: MealPlanPreferences,
    position: number,
    avoidFoodIds: number[],
  ): Observable<MealPlanDraft> {
    return this.http
      .post<ApiResponse<MealPlanDraft>>(apiPaths.mealPlanMealPreview(position), {
        ...preferences,
        avoid_food_ids: avoidFoodIds,
      })
      .pipe(map((res) => res.data));
  }

  save(payload: CreateMealPlanPayload): Observable<MealPlan> {
    return this.http
      .post<ApiResponse<MealPlan>>(apiPaths.mealPlans(), {
        titulo: payload.titulo,
        ...payload.preferences,
      })
      .pipe(map((res) => res.data));
  }

  archive(id: number): Observable<void> {
    return this.http.post<void>(apiPaths.mealPlanArchive(id), {});
  }
}
