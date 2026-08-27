import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiPaths } from '../core/http/api-paths';
import type {
  AdminUserDetail,
  AdminUserEngagement,
  AdminUsersPage,
} from '../core/models/admin-user.model';

export interface AdminUsersFilters {
  search?: string;
  period?: 7 | 30 | 90;
  is_admin?: boolean;
  engagement_status?: AdminUserEngagement;
  page?: number;
  sort?: 'name' | 'created_at';
  direction?: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private readonly http = inject(HttpClient);

  list(filters: AdminUsersFilters): Observable<AdminUsersPage> {
    return this.http.get<AdminUsersPage>(apiPaths.adminUsuarios(), {
      params: this.params(filters),
    });
  }

  detail(id: number, period: 7 | 30 | 90): Observable<{ data: AdminUserDetail }> {
    return this.http.get<{ data: AdminUserDetail }>(apiPaths.adminUsuario(id), {
      params: { period },
    });
  }

  remove(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(apiPaths.adminUsuario(id));
  }

  private params(filters: AdminUsersFilters): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '') params = params.set(key, String(value));
    }
    return params;
  }
}
