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
    <header class="topbar">
      <a routerLink="/" class="back">← Volver</a>
      <span class="brand">Cocina</span>
      <button type="button" class="refresh" (click)="reload()">Actualizar</button>
    </header>

    <main class="content">
      @if (loading()) {
        <p class="muted">Cargando…</p>
      } @else if (error()) {
        <div class="alert">{{ error() }}</div>
      } @else {
        <div class="board">
          @for (order of orders(); track order.id) {
            <article class="ticket" [class]="'st-' + order.status.toLowerCase()">
              <div class="ticket-head">
                <strong>#{{ order.id }}</strong>
                <span class="badge">{{ statusLabel(order.status) }}</span>
              </div>
              <div class="dest">
                {{ order.tableName ?? destLabel(order) }}
              </div>
              <ul class="items">
                @for (item of order.items; track item.id) {
                  <li>
                    <span class="qty">{{ item.quantity }}×</span> {{ item.productName }}
                    @if (item.notes) { <em class="note">({{ item.notes }})</em> }
                  </li>
                }
              </ul>
              <div class="actions">
                @if (nextStatus(order.status); as next) {
                  <button type="button" (click)="advance(order, next)">
                    Marcar {{ statusLabel(next) }}
                  </button>
                }
              </div>
            </article>
          } @empty {
            <p class="muted">No hay pedidos en cocina.</p>
          }
        </div>
      }
    </main>
  `,
  styles: [
    `
      .topbar {
        display: flex; align-items: center; gap: 1rem;
        padding: 0.9rem 1.5rem; background: var(--cf-surface);
        border-bottom: 1px solid rgba(0, 0, 0, 0.3);
      }
      .back { color: var(--cf-text); text-decoration: none; opacity: 0.85; }
      .brand { color: var(--cf-accent); font-weight: 700; font-size: 1.1rem; }
      .refresh {
        margin-left: auto; background: transparent; border: 1px solid var(--cf-accent);
        color: var(--cf-accent); padding: 0.4rem 0.9rem; border-radius: 8px; cursor: pointer;
      }
      .content { max-width: 1100px; margin: 0 auto; padding: 1.5rem; }
      .muted { opacity: 0.75; }
      .board {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem;
      }
      .ticket {
        background: var(--cf-surface); border-radius: 12px; padding: 1rem;
        border-left: 5px solid var(--cf-accent);
      }
      .ticket.st-pending { border-left-color: #e0a000; }
      .ticket.st-preparing { border-left-color: #2196f3; }
      .ticket.st-sent { border-left-color: #2e7d32; }
      .ticket-head { display: flex; justify-content: space-between; align-items: center; }
      .badge {
        font-size: 0.72rem; text-transform: uppercase; background: rgba(255,255,255,0.1);
        padding: 0.15rem 0.5rem; border-radius: 999px;
      }
      .dest { margin: 0.3rem 0 0.5rem; font-weight: 600; }
      .items { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.25rem; }
      .items .qty { color: var(--cf-accent); font-weight: 700; }
      .note { opacity: 0.7; font-size: 0.8rem; }
      .actions { margin-top: 0.8rem; }
      .actions button {
        width: 100%; background: var(--cf-accent); color: #1a120b; border: none;
        border-radius: 8px; padding: 0.55rem; font-weight: 600; cursor: pointer;
      }
      .alert {
        background: rgba(224, 122, 95, 0.15); border: 1px solid var(--cf-error);
        color: var(--cf-error); padding: 0.8rem 1rem; border-radius: 8px;
      }
    `,
  ],
})
export class KitchenComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly realtime = inject(RealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.reload();
    this.realtime.connect();
    this.realtime.orderEvents$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reload());
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.ordersService.getKitchenOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los pedidos de cocina.');
        this.loading.set(false);
      },
    });
  }

  nextStatus(status: OrderStatus): OrderStatus | null {
    switch (status) {
      case 'PENDING':
        return 'PREPARING';
      case 'PREPARING':
        return 'SENT';
      case 'SENT':
        return 'DELIVERED';
      default:
        return null;
    }
  }

  statusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      PENDING: 'Pendiente',
      PREPARING: 'Preparando',
      SENT: 'Listo',
      DELIVERED: 'Entregado',
      PAID: 'Cobrado',
      CANCELLED: 'Cancelado',
    };
    return labels[status];
  }

  destLabel(order: Order): string {
    if (order.type === 'DELIVERY') {
      return `Domicilio${order.customerName ? ' · ' + order.customerName : ''}`;
    }
    if (order.type === 'TAKEAWAY') {
      return 'Para llevar';
    }
    return 'Mesa';
  }

  advance(order: Order, next: OrderStatus): void {
    this.ordersService.updateKitchenStatus(order.id, next).subscribe({
      next: () => this.reload(),
      error: () => this.error.set('No se pudo actualizar el estado.'),
    });
  }
}
