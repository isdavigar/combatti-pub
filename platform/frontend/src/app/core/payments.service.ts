import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export type PaymentMethod = 'CASH' | 'NEQUI' | 'BANCOLOMBIA' | 'BOLD' | 'BREB' | 'MIXED';

export interface PaymentSplitRequest {
  method: PaymentMethod;
  amount: number;
}

export interface CreatePaymentRequest {
  orderId: number;
  method: PaymentMethod;
  amount: number;
  cashReceived?: number | null;
  notes?: string | null;
  splits?: PaymentSplitRequest[] | null;
}

export interface Payment {
  id: number;
  orderId: number;
  method: PaymentMethod;
  amount: number;
  cashReceived: number | null;
  changeGiven: number | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  splits: { method: PaymentMethod; amount: number }[];
}

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/payments`;

  createPayment(request: CreatePaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(this.baseUrl, request);
  }

  listByOrder(orderId: number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseUrl}?orderId=${orderId}`);
  }
}
