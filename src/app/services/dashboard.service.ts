import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { apiPaths } from '../core/http/api-paths';
import type { ApiResponse } from '../core/models/api-response.model';
import type { DashboardResumo } from '../core/models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  resumo(): Observable<DashboardResumo> {
    return this.http
      .get<ApiResponse<DashboardResumo>>(apiPaths.dashboardSummary())
      .pipe(map((res) => res.data));
  }
}
