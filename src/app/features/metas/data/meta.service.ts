import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';

import { apiPaths } from '../../../core/http/api-paths';
import type { ApiResponse } from '../../../core/models/api-response.model';
import type { CreateMetaDiariaPayload, MetaDiaria } from '../../../core/models/meta-diaria.model';

@Injectable({ providedIn: 'root' })
export class MetaService {
  private readonly http = inject(HttpClient);

  list(): Observable<MetaDiaria[]> {
    return this.http.get<ApiResponse<MetaDiaria[]>>(apiPaths.metas()).pipe(map((res) => res.data));
  }

  create(payload: CreateMetaDiariaPayload): Observable<MetaDiaria> {
    return this.http
      .post<ApiResponse<MetaDiaria>>(apiPaths.metas(), payload)
      .pipe(map((res) => res.data));
  }

  update(id: number, payload: CreateMetaDiariaPayload): Observable<MetaDiaria> {
    return this.http
      .put<ApiResponse<MetaDiaria>>(apiPaths.meta(id), payload)
      .pipe(map((res) => res.data));
  }

  /**
   * O backend não impede metas duplicadas (ao contrário de NutricaoRecomendada),
   * mas o produto trata "meta diária" como uma configuração única e contínua —
   * por isso tratamos `data: null` como "a meta vigente" e fazemos upsert nela
   * em vez de deixar acumular registros a cada salvamento.
   */
  save(payload: CreateMetaDiariaPayload): Observable<MetaDiaria> {
    return this.list().pipe(
      switchMap((existing) => {
        const vigente = existing.find((m) => m.data === null) ?? existing[0];
        return vigente ? this.update(vigente.id, payload) : this.create(payload);
      }),
    );
  }
}
