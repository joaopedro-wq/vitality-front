import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { apiPaths } from '../core/http/api-paths';
import type { ApiResponse } from '../core/models/api-response.model';
import type {
  Alimento,
  AlimentoGrupo,
  CreateAlimentoPayload,
  FoodPage,
  FonteAlimento,
  StatusAlimento,
  UpdateAlimentoPayload,
  FoodPlanTag,
  FoodRestriction,
} from '../core/models/alimento.model';

export interface FoodFilters {
  search?: string;
  tab?: 'all' | 'favorites';
  page?: number;
  fonte?: FonteAlimento;
  status?: StatusAlimento;
  grupo?: string[];
  caloria_min?: number;
  caloria_max?: number;
  sort_field?: 'descricao' | 'grupo' | 'caloria' | 'proteina' | 'carbo' | 'gordura';
  sort_order?: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class AlimentoService {
  private readonly http = inject(HttpClient);

  list(filters: FoodFilters = {}): Observable<FoodPage> {
    return this.http.get<FoodPage>(apiPaths.alimentos(), { params: this.params(filters) });
  }

  groups(): Observable<AlimentoGrupo[]> {
    return this.http
      .get<{ data: AlimentoGrupo[] }>(apiPaths.gruposAlimentos())
      .pipe(map((response) => response.data));
  }
  get(id: number): Observable<Alimento> {
    return this.http
      .get<{ data: Alimento }>(apiPaths.alimento(id))
      .pipe(map((response) => response.data));
  }
  favorite(id: number): Observable<Alimento> {
    return this.http
      .post<ApiResponse<Alimento>>(apiPaths.favoritoAlimento(id), {})
      .pipe(map((response) => response.data));
  }
  unfavorite(id: number): Observable<void> {
    return this.http.delete<void>(apiPaths.favoritoAlimento(id));
  }
  adminList(filters: FoodFilters = {}): Observable<FoodPage> {
    return this.http.get<FoodPage>(apiPaths.adminAlimentos(), { params: this.params(filters) });
  }
  duplicates(descricao: string): Observable<Alimento[]> {
    return this.http
      .get<{
        data: Alimento[];
      }>(`${apiPaths.adminAlimentos()}/duplicates`, { params: { descricao } })
      .pipe(map((response) => response.data));
  }
  create(payload: CreateAlimentoPayload): Observable<Alimento> {
    return this.http
      .post<ApiResponse<Alimento>>(apiPaths.adminAlimentos(), payload)
      .pipe(map((response) => response.data));
  }
  update(id: number, payload: UpdateAlimentoPayload): Observable<Alimento> {
    return this.http
      .put<ApiResponse<Alimento>>(apiPaths.adminAlimento(id), payload)
      .pipe(map((response) => response.data));
  }
  archive(id: number): Observable<Alimento> {
    return this.http
      .post<ApiResponse<Alimento>>(apiPaths.adminArquivarAlimento(id), {})
      .pipe(map((response) => response.data));
  }
  restore(id: number): Observable<Alimento> {
    return this.http
      .post<ApiResponse<Alimento>>(apiPaths.adminRestaurarAlimento(id), {})
      .pipe(map((response) => response.data));
  }
  importTaco(): Observable<{ created: number; updated: number; skipped: number }> {
    return this.http
      .post<
        ApiResponse<{ created: number; updated: number; skipped: number }>
      >(apiPaths.adminImportarTaco(), {})
      .pipe(map((response) => response.data));
  }
  planTags(): Observable<FoodPlanTag[]> {
    return this.http
      .get<ApiResponse<FoodPlanTag[]>>(apiPaths.adminFoodPlanTags())
      .pipe(map((response) => response.data));
  }
  updatePlanTags(id: number, slugs: string[]): Observable<Alimento> {
    return this.http
      .put<ApiResponse<Alimento>>(apiPaths.adminFoodPlanTagsFor(id), { slugs })
      .pipe(map((response) => response.data));
  }
  restrictions(): Observable<FoodRestriction[]> {
    return this.http
      .get<ApiResponse<FoodRestriction[]>>(apiPaths.adminFoodRestrictions())
      .pipe(map((response) => response.data));
  }
  updateRestrictions(id: number, slugs: string[]): Observable<Alimento> {
    return this.http
      .put<ApiResponse<Alimento>>(apiPaths.adminFoodRestrictionsFor(id), { slugs })
      .pipe(map((response) => response.data));
  }

  private params(filters: FoodFilters): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === '') continue;
      if (Array.isArray(value)) {
        for (const item of value) params = params.append(`${key}[]`, String(item));
      } else {
        params = params.set(key, String(value));
      }
    }
    return params;
  }
}
