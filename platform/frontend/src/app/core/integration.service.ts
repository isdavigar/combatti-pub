import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface ApiKey {
  id: number;
  name: string;
  keyPrefix: string;
  scopes: string[];
  active: boolean;
  createdBy: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface CreatedApiKey {
  key: ApiKey;
  apiKey: string;
}

export interface CreateApiKeyRequest {
  name: string;
  scopes: string[];
}

@Injectable({ providedIn: 'root' })
export class IntegrationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/integration/keys`;

  list(): Observable<ApiKey[]> {
    return this.http.get<ApiKey[]>(this.baseUrl);
  }

  scopes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/scopes`);
  }

  create(request: CreateApiKeyRequest): Observable<CreatedApiKey> {
    return this.http.post<CreatedApiKey>(this.baseUrl, request);
  }

  revoke(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
