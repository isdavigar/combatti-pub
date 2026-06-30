import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface Settings {
  restaurantName: string;
  taxId: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  currency: string;
  taxRatePercent: number;
  serviceChargePercent: number;
  tipSuggestedPercent: number;
  receiptFooter: string | null;
  printerTransport: string;
  receiptPrinterHost: string | null;
  receiptPrinterPort: number | null;
  kitchenPrinterHost: string | null;
  kitchenPrinterPort: number | null;
  updatedBy: string | null;
  updatedAt: string;
}

export type UpdateSettingsRequest = Omit<Settings, 'updatedBy' | 'updatedAt'>;

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/settings`;

  get(): Observable<Settings> {
    return this.http.get<Settings>(this.baseUrl);
  }

  update(request: UpdateSettingsRequest): Observable<Settings> {
    return this.http.put<Settings>(this.baseUrl, request);
  }
}
