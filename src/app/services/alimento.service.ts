import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { apiPaths } from '../core/http/api-paths';
import type { ApiResponse } from '../core/models/api-response.model';
import type {
  Alimento,
  CreateAlimentoPayload,
  FoodPage,
  FonteAlimento,
  StatusAlimento,
  UpdateAlimentoPayload,
} from '../core/models/alimento.model';

export interface FoodFilters {
  search?: string;
  tab?: 'all' | 'favorites';
  page?: number;
  fonte?: FonteAlimento;
  status?: StatusAlimento;
}

@Injectable({ providedIn: 'root' })
export class AlimentoService {
  private readonly http = inject(HttpClient);

  list(filters: FoodFilters = {}): Observable<FoodPage> {
    return this.http.get<FoodPage>(apiPaths.alimentos(), { params: this.params(filters) });
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
      .get<{ data: Alimento[] }>(`${apiPaths.adminAlimentos()}/duplicates`, { params: { descricao } })
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

  private params(filters: FoodFilters): HttpParams {
    return Object.entries(filters).reduce(
      (params, [key, value]) =>
        value === undefined || value === '' ? params : params.set(key, String(value)),
      new HttpParams(),
    );
  }
}
