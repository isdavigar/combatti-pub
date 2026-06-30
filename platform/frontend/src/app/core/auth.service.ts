import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../environments/environment';

export interface UserDto {
  id: number;
  username: string;
  displayName: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: UserDto;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private static readonly TOKEN_KEY = 'combatti_token';
  private static readonly USER_KEY = 'combatti_user';

  private readonly http = inject(HttpClient);

  private readonly userSignal = signal<UserDto | null>(this.readStoredUser());

  /** Usuario autenticado actual (solo lectura). */
  readonly user = this.userSignal.asReadonly();

  /** Indica si hay una sesión activa. */
  readonly isAuthenticated = computed(() => this.userSignal() !== null && this.getToken() !== null);

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, { username, password })
      .pipe(tap((response) => this.storeSession(response)));
  }

  loadProfile(): Observable<UserDto> {
    return this.http.get<UserDto>(`${environment.apiBaseUrl}/auth/me`).pipe(
      tap((user) => {
        localStorage.setItem(AuthService.USER_KEY, JSON.stringify(user));
        this.userSignal.set(user);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(AuthService.TOKEN_KEY);
    localStorage.removeItem(AuthService.USER_KEY);
    this.userSignal.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(AuthService.TOKEN_KEY);
  }

  hasPermission(permission: string): boolean {
    return this.userSignal()?.permissions?.includes(permission) ?? false;
  }

  private storeSession(response: LoginResponse): void {
    localStorage.setItem(AuthService.TOKEN_KEY, response.token);
    localStorage.setItem(AuthService.USER_KEY, JSON.stringify(response.user));
    this.userSignal.set(response.user);
  }

  private readStoredUser(): UserDto | null {
    const raw = localStorage.getItem(AuthService.USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as UserDto;
    } catch {
      return null;
    }
  }
}
