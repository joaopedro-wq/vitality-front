import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';

import { apiPaths } from '../core/http/api-paths';
import type { ApiResponse } from '../core/models/api-response.model';
import type {
  CreateNutricaoRecomendadaPayload,
  NutricaoRecomendada,
} from '../core/models/nutricao-recomendada.model';

@Injectable({ providedIn: 'root' })
export class RecomendacaoService {
  private readonly http = inject(HttpClient);


  list(): Observable<NutricaoRecomendada[]> {
    return this.http
      .get<ApiResponse<NutricaoRecomendada[]>>(apiPaths.recomendacoes())
      .pipe(map((res) => res.data));
  }

  create(payload: CreateNutricaoRecomendadaPayload): Observable<NutricaoRecomendada> {
    return this.http
      .post<ApiResponse<NutricaoRecomendada>>(apiPaths.recomendacoes(), payload)
      .pipe(map((res) => res.data));
  }

  update(id: number, payload: CreateNutricaoRecomendadaPayload): Observable<NutricaoRecomendada> {
    return this.http
      .put<ApiResponse<NutricaoRecomendada>>(apiPaths.recomendacao(id), payload)
      .pipe(map((res) => res.data));
  }

 
  save(payload: CreateNutricaoRecomendadaPayload): Observable<NutricaoRecomendada> {
    return this.list().pipe(
      switchMap((existing) =>
        existing.length > 0 ? this.update(existing[0].id, payload) : this.create(payload),
      ),
    );
  }
}
