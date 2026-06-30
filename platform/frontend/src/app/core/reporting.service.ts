import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface MethodTotal {
  method: string;
  total: number;
  count: number;
}

export interface SalesReport {
  from: string;
  to: string;
  total: number;
  transactions: number;
  averageTicket: number;
  byMethod: MethodTotal[];
}

export interface TopProduct {
  productName: string;
  quantity: number;
  revenue: number;
}

@Injectable({ providedIn: 'root' })
export class ReportingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/reports`;

  getSales(from?: string, to?: string): Observable<SalesReport> {
    return this.http.get<SalesReport>(`${this.baseUrl}/sales`, { params: this.range(from, to) });
  }

  getTopProducts(from?: string, to?: string, limit = 10): Observable<TopProduct[]> {
    let params = this.range(from, to);
    params = params.set('limit', String(limit));
    return this.http.get<TopProduct[]>(`${this.baseUrl}/top-products`, { params });
  }

  private range(from?: string, to?: string): HttpParams {
    let params = new HttpParams();
    if (from) {
      params = params.set('from', from);
    }
    if (to) {
      params = params.set('to', to);
    }
    return params;
  }
}
