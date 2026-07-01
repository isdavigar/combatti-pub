import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Order, OrdersService } from '../../core/orders.service';
import { PaymentMethod, PaymentsService } from '../../core/payments.service';
import { PosBridgeService } from '../../core/pos-bridge.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="section-header mb-3">
      <div>
        <h2 class="section-title"><i class="fa-solid fa-money-bill-wave"></i> Cobro</h2>
        <p class="section-subtitle">Registra cobros de pedidos activos.</p>
      </div>
    </div>

    @if (error()) { <div class="alert-banner mb-3"><i class="fa-solid fa-circle-exclamation"></i> {{ error() }}</div> }
    @if (success()) { <div class="success-banner mb-3"><i class="fa-solid fa-check-circle"></i> Cobro registrado. Pedido #{{ success() }} pagado.</div> }

    <div class="products-layout">
      <!-- Left: orders list -->
      <div class="products-panel">
        <div class="glass-card">
          <h4 class="section-title mb-2">Pedidos por cobrar</h4>
          @if (loading()) {
            <p class="text-muted">Cargando…</p>
          } @else if (pendingOrders().length === 0) {
            <p class="text-muted">No hay pedidos pendientes de cobro.</p>
          } @else {
            <div class="metric-list">
              @for (order of pendingOrders(); track order.id) {
                <div class="metric-row clickable" [class.selected]="selected()?.id === order.id" (click)="select(order)">
                  <span><strong class="text-primary">#{{ order.id }}</strong> — {{ order.tableName ?? destLabel(order) }}</span>
                  <strong>{{ formatPrice(order.subtotal) }}</strong>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Right: payment form -->
      <div class="invoice-panel">
        @if (selected(); as order) {
          <div class="glass-card">
            <h4 class="section-title mb-2">Cobrar #{{ order.id }}</h4>
            <div class="mini-table mb-3"><span>Total</span><strong style="font-size:1.4rem;color:var(--primary)">{{ formatPrice(order.subtotal) }}</strong></div>

            <label class="form-label">Método de pago</label>
            <div class="payment-methods mb-3">
              @for (m of methods; track m.value) {
                <button class="category-chip" [class.active]="method() === m.value" (click)="setMethod(m.value)">
                  {{ m.label }}
                </button>
              }
            </div>

            @if (method() === 'CASH') {
              <div class="cash-payment-box">
                <div class="form-group">
                  <label class="form-label">Efectivo recibido</label>
                  <input type="number" class="form-control" min="0" [ngModel]="cashReceived()" (ngModelChange)="cashReceived.set($event)" />
                </div>
                <div class="cash-change-box">
                  <small>Vuelto</small>
                  <strong [class.text-danger]="change() < 0">{{ formatPrice(change()) }}</strong>
                </div>
              </div>
            }

            <button class="btn btn-success btn-pill w-100 mt-3" [disabled]="!canSubmit() || submitting()" (click)="submit(order)">
              <i class="fa-solid fa-check"></i> {{ submitting() ? 'Procesando…' : 'Confirmar cobro' }}
            </button>
          </div>
        } @else {
          <div class="glass-card" style="min-height:300px;display:grid;place-items:center">
            <div class="text-center text-muted">
              <i class="fa-solid fa-hand-pointer" style="font-size:2rem;opacity:.4;display:block;margin-bottom:8px"></i>
              Selecciona un pedido para cobrar
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .mb-2 { margin-bottom: .5rem; }
    .mb-3 { margin-bottom: 1rem; }
    .mt-3 { margin-top: 1rem; }
    .w-100 { width: 100%; }
    .text-muted { color: var(--muted); }
    .text-center { text-align: center; }
    .text-primary { color: var(--primary); }
    .section-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .alert-banner { background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.3); color: #dc2626; border-radius: 14px; padding: .75rem 1rem; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    .success-banner { background: rgba(25,195,125,.08); border: 1px solid rgba(25,195,125,.3); color: var(--primary); border-radius: 14px; padding: .75rem 1rem; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    .form-group { margin-bottom: .75rem; }
    .payment-methods { display: flex; flex-wrap: wrap; gap: 8px; }
    .metric-row.clickable { cursor: pointer; transition: .15s ease; }
    .metric-row.clickable:hover { border-color: rgba(var(--primary-rgb),.4); background: rgba(var(--primary-rgb),.06); }
    .metric-row.selected { border-color: var(--primary); background: rgba(var(--primary-rgb),.10); }
    .cash-payment-box { border: 1px solid rgba(var(--primary-rgb),.20); background: linear-gradient(180deg, rgba(var(--primary-rgb),.08), rgba(37,99,235,.03)); border-radius: 20px; padding: 14px; margin-top: 14px; }
    .cash-change-box { border: 2px solid rgba(var(--primary-rgb),.25); background: rgba(var(--primary-rgb),.08); border-radius: 18px; padding: 14px; text-align: center; margin-top: 12px; }
    .cash-change-box small { display: block; color: var(--muted); margin-bottom: 4px; }
    .cash-change-box strong { font-size: 1.5rem; color: var(--primary); }
    .text-danger { color: var(--danger) !important; }
  `],
})
export class CheckoutComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly paymentsService = inject(PaymentsService);
  private readonly posBridge = inject(PosBridgeService);

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

  readonly pendingOrders = computed(() => this.orders().filter((o) => o.status !== 'PAID' && o.status !== 'CANCELLED'));
  readonly change = computed(() => {
    const order = this.selected();
    const received = this.cashReceived();
    if (!order || received == null) return 0;
    return received - order.subtotal;
  });

  ngOnInit(): void { this.loadOrders(); }

  loadOrders(): void {
    this.loading.set(true);
    this.ordersService.getOrders().subscribe({
      next: (orders) => { this.orders.set(orders); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar los pedidos.'); this.loading.set(false); },
    });
  }

  select(order: Order): void { this.selected.set(order); this.success.set(null); this.cashReceived.set(null); this.method.set('CASH'); }
  setMethod(method: PaymentMethod): void { this.method.set(method); }

  canSubmit(): boolean {
    const order = this.selected();
    if (!order) return false;
    if (this.method() === 'CASH') { const r = this.cashReceived(); return r != null && r >= order.subtotal; }
    return true;
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  }

  destLabel(order: Order): string {
    if (order.type === 'DELIVERY') return 'Domicilio';
    if (order.type === 'TAKEAWAY') return 'Para llevar';
    return 'Mesa';
  }

  submit(order: Order): void {
    if (!this.canSubmit()) return;
    this.submitting.set(true); this.error.set(null);
    const isCash = this.method() === 'CASH';
    this.paymentsService.createPayment({ orderId: order.id, method: this.method(), amount: order.subtotal, cashReceived: isCash ? this.cashReceived() : null }).subscribe({
      next: () => {
        this.printReceiptBestEffort(order);
        this.submitting.set(false); this.success.set(order.id); this.selected.set(null); this.loadOrders();
      },
      error: () => { this.submitting.set(false); this.error.set('No se pudo registrar el cobro.'); },
    });
  }

  private printReceiptBestEffort(order: Order): void {
    const isCash = this.method() === 'CASH';
    this.posBridge.printReceipt({ orderId: order.id, items: order.items.map((i) => ({ name: i.productName, quantity: i.quantity, lineTotal: i.lineTotal })), total: order.subtotal, paymentMethod: this.method(), cashReceived: isCash ? this.cashReceived() : null, changeGiven: isCash ? this.change() : null, openDrawer: isCash }).subscribe({ next: () => undefined, error: () => undefined });
  }
}
