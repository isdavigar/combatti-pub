import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface ReceiptLine {
  name: string;
  quantity: number;
  lineTotal: number;
}

export interface ReceiptRequest {
  orderId?: number | null;
  items: ReceiptLine[];
  total: number;
  paymentMethod?: string | null;
  cashReceived?: number | null;
  changeGiven?: number | null;
  openDrawer: boolean;
}

export interface KitchenItem {
  name: string;
  quantity: number;
  notes?: string | null;
}

export interface KitchenTicketRequest {
  orderId?: number | null;
  destination?: string | null;
  items: KitchenItem[];
  notes?: string | null;
}

/**
 * Cliente del POS Local Bridge (hardware local). Todas las llamadas son
 * "best-effort": si el bridge no está disponible, el caller debe ignorar el
 * error para no bloquear la operación.
 */
@Injectable({ providedIn: 'root' })
export class PosBridgeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.bridgeBaseUrl;

  printReceipt(request: ReceiptRequest): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/print/receipt`, request);
  }

  printKitchen(request: KitchenTicketRequest): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/print/kitchen`, request);
  }

  openDrawer(): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/cash-drawer/open`, {});
  }

  status(): Observable<{ printer: string }> {
    return this.http.get<{ printer: string }>(`${this.baseUrl}/status`);
  }
}
