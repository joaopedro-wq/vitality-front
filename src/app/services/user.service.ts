import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { apiPaths } from '../core/http/api-paths';
import type { ApiResponse } from '../core/models/api-response.model';
import type { UpdateUserPayload, User } from '../core/models/user.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  updateProfile(payload: UpdateUserPayload): Observable<User> {
    return this.http
      .put<ApiResponse<User>>(apiPaths.user(), payload)
      .pipe(map((res) => this.normalizeUser(res.data)));
  }

  uploadAvatar(avatar: File): Observable<User> {
    const formData = new FormData();
    formData.set('avatar', avatar);

    return this.http
      .post<ApiResponse<User>>(apiPaths.userAvatar(), formData)
      .pipe(map((res) => this.normalizeUser(res.data)));
  }

  removeAvatar(): Observable<void> {
    return this.http.delete(apiPaths.userAvatar()).pipe(map(() => undefined));
  }

  /** Compatibilidade para registros de avatar legados que ainda possam conter caminho relativo. */
  private normalizeUser(user: User): User {
    if (!user.avatar || /^(https?:)?\/\//.test(user.avatar)) return user;
    return { ...user, avatar: `${environment.apiUrl}/storage/${user.avatar.replace(/^\/+/, '')}` };
  }
}
