import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';

import { authPaths, apiPaths } from '../http/api-paths';
import { TokenStore } from './token.store';
import type { ApiResponse, LoginResponse } from '../models/api-response.model';
import type { User } from '../models/user.model';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface RegisterResponse {
  message: string;
  data: User;
  success: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStore = inject(TokenStore);
  private readonly currentUserSignal = signal<User | null>(null);
  private readonly bootstrappedSignal = signal(false);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly bootstrapped = this.bootstrappedSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  /** Mantém a sessão em memória sincronizada após alterações feitas no perfil. */
  setCurrentUser(user: User): void {
    this.currentUserSignal.set(user);
  }

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(authPaths.login(), payload).pipe(
      tap((res) => {
        this.tokenStore.set(res.token);
        this.currentUserSignal.set(res.user);
      })
    );
  }

  register(payload: RegisterPayload): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(authPaths.criarUsuario(), payload);
  }

  logout(): Observable<unknown> {
    return this.http.post(authPaths.logout(), {}).pipe(
      catchError(() => of(null)),
      tap(() => this.forceLogout())
    );
  }

  forceLogout(): void {
    this.tokenStore.clear();
    this.currentUserSignal.set(null);
  }

  /** Encerra o boot sem ida à rede — usado quando não há token guardado. */
  markBootstrapped(): void {
    this.bootstrappedSignal.set(true);
  }

  restoreSession(): Observable<User | null> {
    return this.http.get<ApiResponse<User>>(apiPaths.me()).pipe(
      map((res) => res.data),
      tap((user) => {
        this.currentUserSignal.set(user);
      }),
      catchError(() => {
        this.forceLogout();
        return of(null);
      }),
      finalize(() => this.bootstrappedSignal.set(true))
    );
  }

  refreshSession(): Observable<void> {
    return this.http.post<void>(apiPaths.sessionRefresh(), {});
  }
}
