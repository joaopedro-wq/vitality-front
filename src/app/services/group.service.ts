import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { apiPaths } from '../core/http/api-paths';
import type { ApiResponse } from '../core/models/api-response.model';
import type {
  CreateGroupPayload,
  Group,
  GroupActivityItem,
  GroupRankingEntry,
} from '../core/models/group.model';

@Injectable({ providedIn: 'root' })
export class GroupService {
  private readonly http = inject(HttpClient);

  list(): Observable<Group[]> {
    return this.http.get<ApiResponse<Group[]>>(apiPaths.groups()).pipe(map((res) => res.data));
  }

  create(payload: CreateGroupPayload): Observable<Group> {
    return this.http
      .post<ApiResponse<Group>>(apiPaths.groups(), payload)
      .pipe(map((res) => res.data));
  }

  join(inviteCode: string): Observable<Group> {
    return this.http
      .post<ApiResponse<Group>>(apiPaths.groupJoin(), { invite_code: inviteCode })
      .pipe(map((res) => res.data));
  }

  get(id: number): Observable<Group> {
    return this.http.get<ApiResponse<Group>>(apiPaths.group(id)).pipe(map((res) => res.data));
  }

  leave(id: number): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(apiPaths.groupLeave(id), {})
      .pipe(map(() => undefined));
  }

  remove(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(apiPaths.group(id)).pipe(map(() => undefined));
  }

  ranking(id: number): Observable<GroupRankingEntry[]> {
    return this.http
      .get<ApiResponse<GroupRankingEntry[]>>(apiPaths.groupRanking(id))
      .pipe(map((res) => res.data));
  }

  activity(id: number): Observable<GroupActivityItem[]> {
    return this.http
      .get<ApiResponse<GroupActivityItem[]>>(apiPaths.groupActivity(id))
      .pipe(map((res) => res.data));
  }
}
