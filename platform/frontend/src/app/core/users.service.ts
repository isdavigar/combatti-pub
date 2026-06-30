import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface UserSummary {
  id: number;
  username: string;
  displayName: string;
  tenantId: string;
  roles: string[];
  enabled: boolean;
  createdAt: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
}

export interface CreateUserRequest {
  username: string;
  displayName: string;
  password: string;
  roles: string[];
  enabled: boolean;
}

export interface UpdateUserRequest {
  displayName: string;
  roles: string[];
  enabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  listUsers(): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${this.baseUrl}/users`);
  }

  listRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.baseUrl}/roles`);
  }

  createUser(request: CreateUserRequest): Observable<UserSummary> {
    return this.http.post<UserSummary>(`${this.baseUrl}/users`, request);
  }

  updateUser(id: number, request: UpdateUserRequest): Observable<UserSummary> {
    return this.http.put<UserSummary>(`${this.baseUrl}/users/${id}`, request);
  }

  resetPassword(id: number, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/users/${id}/password`, { newPassword });
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${id}`);
  }
}
