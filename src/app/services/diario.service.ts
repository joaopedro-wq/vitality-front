import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { apiPaths } from '../core/http/api-paths';
import type { ApiResponse } from '../core/models/api-response.model';
import type {
  DiaryDay,
  DiaryEntry,
  DiaryMeal,
  SaveDiaryEntryPayload,
  SaveDiaryMealPayload,
} from '../core/models/diary.model';

@Injectable({ providedIn: 'root' })
export class DiarioService {
  private readonly http = inject(HttpClient);

  day(date: string): Observable<DiaryDay> {
    return this.http
      .get<
        ApiResponse<DiaryDay>
      >(apiPaths.diaryDay(), { params: new HttpParams().set('date', date) })
      .pipe(map((response) => response.data));
  }

  meals(includeArchived = false): Observable<DiaryMeal[]> {
    const params = includeArchived ? new HttpParams().set('include_archived', 'true') : undefined;
    return this.http
      .get<ApiResponse<DiaryMeal[]>>(apiPaths.diaryMeals(), { params })
      .pipe(map((response) => response.data));
  }

  createEntry(payload: SaveDiaryEntryPayload): Observable<DiaryEntry> {
    return this.http
      .post<ApiResponse<DiaryEntry>>(apiPaths.diaryEntries(), payload)
      .pipe(map((response) => response.data));
  }

  updateEntry(id: number, payload: SaveDiaryEntryPayload): Observable<DiaryEntry> {
    return this.http
      .patch<ApiResponse<DiaryEntry>>(apiPaths.diaryEntry(id), payload)
      .pipe(map((response) => response.data));
  }

  deleteEntry(id: number): Observable<void> {
    return this.http.delete<void>(apiPaths.diaryEntry(id));
  }

  createMeal(payload: SaveDiaryMealPayload): Observable<DiaryMeal> {
    return this.http
      .post<ApiResponse<DiaryMeal>>(apiPaths.diaryMeals(), payload)
      .pipe(map((response) => response.data));
  }

  updateMeal(id: number, payload: Partial<SaveDiaryMealPayload>): Observable<DiaryMeal> {
    return this.http
      .patch<ApiResponse<DiaryMeal>>(apiPaths.diaryMeal(id), payload)
      .pipe(map((response) => response.data));
  }

  archiveMeal(id: number): Observable<void> {
    return this.http.delete<void>(apiPaths.diaryMeal(id));
  }
}
