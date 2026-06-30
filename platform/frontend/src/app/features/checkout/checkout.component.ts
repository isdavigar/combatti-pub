import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Order, OrdersService } from '../../core/orders.service';
import { PaymentMethod, PaymentsService } from '../../core/payments.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <header class="topbar">
      <a routerLink="/" class="back">← Volver</a>
      <span class="brand">Cobro</span>
    </header>

    <main class="content">
      @if (error()) { <div class="alert">{{ error() }}</div> }
      @if (success()) {
        <div class="ok">Cobro registrado. Pedido #{{ success() }} marcado como pagado.</div>
      }

      <section class="card">
        <h3>Pedidos por cobrar</h3>
        @if (loading()) {
          <p class="muted">Cargando…</p>
        } @else if (pendingOrders().length === 0) {
          <p class="muted">No hay pedidos pendientes de cobro.</p>
        } @else {
          <ul class="orders">
            @for (order of pendingOrders(); track order.id) {
              <li
                class="order"
                [class.selected]="selected()?.id === order.id"
                (click)="select(order)"
              >
                <span class="oid">#{{ order.id }}</span>
                <span class="dest">{{ order.tableName ?? destLabel(order) }}</span>
                <span class="amount">{{ formatPrice(order.subtotal) }}</span>
              </li>
            }
          </ul>
        }
      </section>

      @if (selected(); as order) {
        <section class="card">
          <h3>Cobrar pedido #{{ order.id }}</h3>
          <div class="total-row">
            <span>Total</span>
            <strong>{{ formatPrice(order.subtotal) }}</strong>
          </div>

          <label>Método de pago</label>
          <div class="methods">
            @for (m of methods; track m.value) {
              <button
                type="button"
                class="method"
                [class.active]="method() === m.value"
                (click)="setMethod(m.value)"
              >
                {{ m.label }}
              </button>
            }
          </div>

          @if (method() === 'CASH') {
            <label for="received">Efectivo recibido</label>
            <input
              id="received"
              type="number"
              min="0"
              [ngModel]="cashReceived()"
              (ngModelChange)="cashReceived.set($event)"
              name="received"
            />
            <div class="change-row" [class.negative]="change() < 0">
              <span>Vuelto</span>
              <strong>{{ formatPrice(change()) }}</strong>
            </div>
          }

          <button
            type="button"
            class="submit"
            [disabled]="!canSubmit() || submitting()"
            (click)="submit(order)"
          >
            {{ submitting() ? 'Procesando…' : 'Confirmar cobro' }}
          </button>
        </section>
      }
    </main>
  `,
  styles: [
    `
      .topbar {
        display: flex; align-items: center; gap: 1rem; padding: 0.9rem 1.5rem;
        background: var(--cf-surface); border-bottom: 1px solid rgba(0, 0, 0, 0.3);
      }
      .back { color: var(--cf-text); text-decoration: none; opacity: 0.85; }
      .brand { color: var(--cf-accent); font-weight: 700; font-size: 1.1rem; }
      .content { max-width: 640px; margin: 0 auto; padding: 1.5rem; }
      .muted { opacity: 0.75; }
      .card { background: var(--cf-surface); border-radius: 12px; padding: 1.1rem 1.3rem; margin-bottom: 1.2rem; }
      .card h3 { margin-top: 0; color: var(--cf-accent); }
      .orders { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
      .order {
        display: grid; grid-template-columns: auto 1fr auto; gap: 0.8rem; align-items: center;
        padding: 0.6rem 0.8rem; border-radius: 8px; cursor: pointer;
        background: rgba(0,0,0,0.15); border: 1px solid transparent;
      }
      .order.selected { border-color: var(--cf-accent); }
      .oid { color: var(--cf-accent); font-weight: 700; }
      .amount { font-weight: 600; }
      label { display: block; font-size: 0.85rem; margin: 0.8rem 0 0.3rem; }
      input {
        width: 100%; padding: 0.6rem 0.7rem; border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.15); background: rgba(0,0,0,0.2); color: var(--cf-text);
      }
      .total-row, .change-row {
        display: flex; justify-content: space-between; padding: 0.5rem 0; font-size: 1.1rem;
      }
      .change-row.negative strong { color: var(--cf-error); }
      .methods { display: flex; flex-wrap: wrap; gap: 0.5rem; }
      .method {
        background: rgba(200, 134, 43, 0.12); border: 1px solid var(--cf-accent);
        color: var(--cf-text); border-radius: 8px; padding: 0.5rem 0.9rem; cursor: pointer;
      }
      .method.active { background: var(--cf-accent); color: #1a120b; font-weight: 600; }
      .submit {
        width: 100%; margin-top: 1rem; background: var(--cf-accent); color: #1a120b;
        border: none; border-radius: 8px; padding: 0.8rem; font-weight: 700; cursor: pointer;
      }
      .submit:disabled { opacity: 0.5; cursor: not-allowed; }
      .alert {
        background: rgba(224,122,95,0.15); border: 1px solid var(--cf-error);
        color: var(--cf-error); padding: 0.8rem 1rem; border-radius: 8px; margin-bottom: 1rem;
      }
      .ok {
        background: rgba(46,125,50,0.18); border: 1px solid #2e7d32;
        color: #9ed99f; padding: 0.8rem 1rem; border-radius: 8px; margin-bottom: 1rem;
      }
    `,
  ],
})
export class CheckoutComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly paymentsService = inject(PaymentsService);

  readonly methods: { value: PaymentMethod; label: string }[] = [
    { value: 'CASH', label: 'Efectivo' },
    { value: 'NEQUI', label: 'Nequi' },
    { value: 'BANCOLOMBIA', label: 'Bancolombia' },
    { value: 'BOLD', label: 'Bold' },
    { value: 'BREB', label: 'Bre-B' },
  ];

  readonly orders = signal<Order[]>([]);
  readonly selected = signal<Order | null>(null);
  readonly method = signal<PaymentMethod>('CASH');
  readonly cashReceived = signal<number | null>(null);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<number | null>(null);

  readonly pendingOrders = computed(() =>
    this.orders().filter((o) => o.status !== 'PAID' && o.status !== 'CANCELLED'),
  );

  readonly change = computed(() => {
    const order = this.selected();
    const received = this.cashReceived();
    if (!order || received == null) {
      return 0;
    }
    return received - order.subtotal;
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.ordersService.getOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los pedidos.');
        this.loading.set(false);
      },
    });
  }

  select(order: Order): void {
    this.selected.set(order);
    this.success.set(null);
    this.cashReceived.set(null);
    this.method.set('CASH');
  }

  setMethod(method: PaymentMethod): void {
    this.method.set(method);
  }

  canSubmit(): boolean {
    const order = this.selected();
    if (!order) {
      return false;
    }
    if (this.method() === 'CASH') {
      const received = this.cashReceived();
      return received != null && received >= order.subtotal;
    }
    return true;
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  destLabel(order: Order): string {
    if (order.type === 'DELIVERY') {
      return 'Domicilio';
    }
    if (order.type === 'TAKEAWAY') {
      return 'Para llevar';
    }
    return 'Mesa';
  }

  submit(order: Order): void {
    if (!this.canSubmit()) {
      return;
    }
    this.submitting.set(true);
    this.error.set(null);

    const isCash = this.method() === 'CASH';
    this.paymentsService
      .createPayment({
        orderId: order.id,
        method: this.method(),
        amount: order.subtotal,
        cashReceived: isCash ? this.cashReceived() : null,
      })
      .subscribe({
        next: () => {
          // El backend (payments-service) ya marca el pedido como PAID.
          this.submitting.set(false);
          this.success.set(order.id);
          this.selected.set(null);
          this.loadOrders();
        },
        error: () => {
          this.submitting.set(false);
          this.error.set('No se pudo registrar el cobro.');
        },
      });
  }
}
