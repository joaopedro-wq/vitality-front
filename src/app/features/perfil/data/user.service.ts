import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { apiPaths } from '../../../core/http/api-paths';
import type { ApiResponse } from '../../../core/models/api-response.model';
import type { UpdateUserPayload, User } from '../../../core/models/user.model';


@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  updateProfile(id: number, payload: UpdateUserPayload): Observable<User> {
    return this.http
      .put<ApiResponse<User>>(apiPaths.user(id), payload)
      .pipe(map((res) => res.data));
  }
}
