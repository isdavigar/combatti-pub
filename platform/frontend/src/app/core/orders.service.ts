import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export type OrderType = 'DINE_IN' | 'DELIVERY' | 'TAKEAWAY';
export type OrderChannel = 'LOCAL' | 'RAPPI' | 'DIDI';
export type OrderStatus =
  | 'PENDING'
  | 'PREPARING'
  | 'SENT'
  | 'DELIVERED'
  | 'PAID'
  | 'CANCELLED';

export interface RestaurantTable {
  id: number;
  name: string;
  kind: string;
  icon: string | null;
  posX: number;
  posY: number;
  size: number;
  sortOrder: number;
  active: boolean;
  occupied: boolean;
}

export interface OrderItem {
  id: number | null;
  productId: number | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  notes: string | null;
  lineTotal: number;
}

export interface Order {
  id: number;
  type: OrderType;
  channel: OrderChannel;
  status: OrderStatus;
  tableId: number | null;
  tableName: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  notes: string | null;
  subtotal: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface OrderItemRequest {
  productId: number | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  notes?: string | null;
}

export interface CreateOrderRequest {
  type: OrderType;
  channel: OrderChannel;
  tableId?: number | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  notes?: string | null;
  items: OrderItemRequest[];
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/orders`;

  getTables(): Observable<RestaurantTable[]> {
    return this.http.get<RestaurantTable[]>(`${this.baseUrl}/tables`);
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.baseUrl);
  }

  getKitchenOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/kitchen`);
  }

  createOrder(request: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, request);
  }

  updateKitchenStatus(orderId: number, status: OrderStatus): Observable<Order> {
    return this.http.patch<Order>(`${this.baseUrl}/kitchen/${orderId}/status`, { status });
  }

  updateStatus(orderId: number, status: OrderStatus): Observable<Order> {
    return this.http.patch<Order>(`${this.baseUrl}/${orderId}/status`, { status });
  }
}
