import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export type CashSessionStatus = 'OPEN' | 'CLOSED';
export type MovementType = 'INCOME' | 'EXPENSE';

export interface CashMovement {
  id: number;
  type: MovementType;
  amount: number;
  concept: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface CashSession {
  id: number;
  status: CashSessionStatus;
  openingAmount: number;
  openedBy: string | null;
  openedAt: string;
  closedBy: string | null;
  closedAt: string | null;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  expectedCash: number | null;
  countedCash: number | null;
  difference: number | null;
  notes: string | null;
  movements: CashMovement[];
}

@Injectable({ providedIn: 'root' })
export class CashService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/cash`;

  /** Devuelve la sesión abierta o null (204). */
  getCurrent(): Observable<CashSession | null> {
    return this.http.get<CashSession | null>(`${this.baseUrl}/current`);
  }

  open(openingAmount: number, notes?: string): Observable<CashSession> {
    return this.http.post<CashSession>(`${this.baseUrl}/open`, { openingAmount, notes });
  }

  close(countedCash: number, notes?: string): Observable<CashSession> {
    return this.http.post<CashSession>(`${this.baseUrl}/close`, { countedCash, notes });
  }

  addMovement(type: MovementType, amount: number, concept?: string): Observable<CashSession> {
    return this.http.post<CashSession>(`${this.baseUrl}/movements`, { type, amount, concept });
  }

  sessions(): Observable<CashSession[]> {
    return this.http.get<CashSession[]>(`${this.baseUrl}/sessions`);
  }
}
