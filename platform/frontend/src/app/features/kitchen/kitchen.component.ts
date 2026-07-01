import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Order, OrderStatus, OrdersService } from '../../core/orders.service';
import { RealtimeService } from '../../core/realtime.service';

@Component({
  selector: 'app-kitchen',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="kitchen-screen">
      <div class="kitchen-shell">
        <div class="kitchen-header">
          <div class="kitchen-title">
            <div class="brand-logo"><i class="fa-solid fa-fire-burner"></i></div>
            <div>
              <h1>Cocina</h1>
              <p>Pedidos en preparación</p>
            </div>
          </div>
          <div class="kitchen-clock">
            <strong>{{ currentTime() }}</strong>
            <span>{{ currentDate() }}</span>
          </div>
        </div>

        @if (loading()) {
          <div class="kitchen-empty"><p>Cargando pedidos…</p></div>
        } @else if (error()) {
          <div class="kitchen-empty" style="border-color:rgba(239,68,68,.4)">
            <p style="color:#f87171">{{ error() }}</p>
            <button class="btn btn-pill btn-primary-soft" (click)="reload()">Reintentar</button>
          </div>
        } @else if (orders().length === 0) {
          <div class="kitchen-empty">
            <i class="fa-solid fa-check-circle" style="font-size:2.5rem;opacity:.4"></i>
            <p>No hay pedidos en cocina</p>
          </div>
        } @else {
          <div class="kitchen-orders">
            @for (order of orders(); track order.id) {
              <div class="kitchen-order-card" [class.is-warning]="order.status === 'PREPARING'" [class.is-late]="isLate(order)">
                <div class="kitchen-order-head">
                  <div>
                    <span class="badge-soft">#{{ order.id }} · {{ statusLabel(order.status) }}</span>
                    <h2>{{ order.tableName ?? destLabel(order) }}</h2>
                    <div class="kitchen-order-meta">
                      <span><i class="fa-solid fa-clock"></i> {{ timeAgo(order) }}</span>
                      <span><i class="fa-solid fa-utensils"></i> {{ order.items.length }} items</span>
                    </div>
                  </div>
                  <div class="kitchen-timer" [class.is-warning]="order.status === 'PREPARING'" [class.is-late]="isLate(order)">
                    <span>Tiempo</span>
                    <strong>{{ timeAgo(order) }}</strong>
                  </div>
                </div>
                <div class="kitchen-items">
                  @for (item of order.items; track item.id) {
                    <div class="kitchen-item">
                      <div class="qty">{{ item.quantity }}</div>
                      <div>
                        <strong>{{ item.productName }}</strong>
                        @if (item.notes) { <br><small style="color:#94a3b8">{{ item.notes }}</small> }
                      </div>
                    </div>
                  }
                </div>
                @if (nextStatus(order.status); as next) {
                  <div style="margin-top:12px">
                    <button class="btn btn-success btn-pill w-100" (click)="advance(order, next)">
                      <i class="fa-solid fa-check"></i> Marcar {{ statusLabel(next) }}
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; margin: -22px; }
    .kitchen-screen { min-height: 100vh; background: #07111f; color: #f8fafc; padding: 22px; }
    .kitchen-shell { max-width: 1180px; margin: 0 auto; }
    .kitchen-header {
      display: flex; align-items: center; justify-content: space-between;
      gap: 18px; flex-wrap: wrap; margin-bottom: 18px;
      padding-bottom: 16px; border-bottom: 1px solid rgba(148,163,184,.24);
    }
    .kitchen-title { display: flex; align-items: center; gap: 12px; }
    .kitchen-title .brand-logo { width: 54px; height: 54px; border-radius: 16px; }
    .kitchen-title h1 { font-size: 1.55rem; font-weight: 900; margin: 0; }
    .kitchen-title p { color: #94a3b8; margin: 0; }
    .kitchen-clock { text-align: right; }
    .kitchen-clock strong { display: block; font-size: 1.55rem; line-height: 1.1; }
    .kitchen-clock span { color: #94a3b8; }
    .kitchen-orders { display: grid; grid-template-columns: 1fr; gap: 12px; }
    .kitchen-order-card {
      background: #0f172a; border: 1px solid rgba(148,163,184,.22);
      border-left: 6px solid var(--primary); border-radius: 16px;
      padding: 16px; box-shadow: 0 18px 44px rgba(0,0,0,.22);
    }
    .kitchen-order-card.is-warning { border-left-color: #f59e0b; }
    .kitchen-order-card.is-late { border-left-color: #ef4444; }
    .kitchen-order-head { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 16px; align-items: start; margin-bottom: 12px; }
    .kitchen-order-head h2 { font-size: 1.28rem; font-weight: 900; margin: 6px 0 4px; }
    .kitchen-order-meta { display: flex; flex-wrap: wrap; gap: 8px; color: #cbd5e1; font-size: .88rem; }
    .kitchen-timer {
      min-width: 168px; border: 1px solid rgba(148,163,184,.22); border-radius: 14px;
      padding: 12px; text-align: center; background: rgba(15,23,42,.88);
    }
    .kitchen-timer span { display: block; color: #94a3b8; font-size: .76rem; text-transform: uppercase; font-weight: 800; }
    .kitchen-timer strong { display: block; font-size: 1.85rem; line-height: 1.05; margin: 4px 0; }
    .kitchen-timer.is-warning strong { color: #fbbf24; }
    .kitchen-timer.is-late strong { color: #f87171; }
    .kitchen-items { display: grid; gap: 8px; }
    .kitchen-item {
      display: grid; grid-template-columns: 54px minmax(0,1fr); gap: 12px; align-items: start;
      padding: 10px 12px; border-radius: 12px; background: rgba(148,163,184,.09);
    }
    .kitchen-item strong { font-size: 1.1rem; }
    .kitchen-item .qty {
      width: 42px; height: 42px; display: grid; place-items: center; border-radius: 12px;
      background: rgba(var(--primary-rgb),.18); color: #86efac; font-weight: 900;
    }
    .kitchen-empty {
      border: 1px dashed rgba(148,163,184,.28); border-radius: 18px;
      padding: 36px 18px; text-align: center; background: rgba(15,23,42,.62); color: #94a3b8;
    }
    .w-100 { width: 100%; }
  `],
})
export class KitchenComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly realtime = inject(RealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly currentTime = signal('--:--');
  readonly currentDate = signal('');

  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.reload();
    this.updateClock();
    this.timer = setInterval(() => this.updateClock(), 1000);
    this.realtime.connect();
    this.realtime.orderEvents$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reload());
  }

  private updateClock(): void {
    const now = new Date();
    this.currentTime.set(now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    this.currentDate.set(now.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }));
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.ordersService.getKitchenOrders().subscribe({
      next: (orders) => { this.orders.set(orders); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar los pedidos de cocina.'); this.loading.set(false); },
    });
  }

  isLate(order: Order): boolean {
    if (!order.createdAt) return false;
    const elapsed = Date.now() - new Date(order.createdAt).getTime();
    return elapsed > 15 * 60 * 1000; // 15 min
  }

  timeAgo(order: Order): string {
    if (!order.createdAt) return '—';
    const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
    return elapsed < 1 ? '<1 min' : `${elapsed} min`;
  }

  nextStatus(status: OrderStatus): OrderStatus | null {
    switch (status) {
      case 'PENDING': return 'PREPARING';
      case 'PREPARING': return 'SENT';
      case 'SENT': return 'DELIVERED';
      default: return null;
    }
  }

  statusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      PENDING: 'Pendiente', PREPARING: 'Preparando', SENT: 'Listo',
      DELIVERED: 'Entregado', PAID: 'Cobrado', CANCELLED: 'Cancelado',
    };
    return labels[status];
  }

  destLabel(order: Order): string {
    if (order.type === 'DELIVERY') return `Domicilio${order.customerName ? ' · ' + order.customerName : ''}`;
    if (order.type === 'TAKEAWAY') return 'Para llevar';
    return 'Mesa';
  }

  advance(order: Order, next: OrderStatus): void {
    this.ordersService.updateKitchenStatus(order.id, next).subscribe({
      next: () => this.reload(),
      error: () => this.error.set('No se pudo actualizar el estado.'),
    });
  }
}
