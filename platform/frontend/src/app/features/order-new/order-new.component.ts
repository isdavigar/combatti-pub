import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CatalogService, Product } from '../../core/catalog.service';
import {
  CreateOrderRequest,
  OrderChannel,
  OrderType,
  OrdersService,
  RestaurantTable,
} from '../../core/orders.service';

interface CartLine {
  product: Product;
  qty: number;
}

@Component({
  selector: 'app-order-new',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <header class="topbar">
      <a routerLink="/tables" class="back">← Mesas</a>
      <span class="brand">Nuevo pedido</span>
    </header>

    <main class="content">
      @if (error()) { <div class="alert">{{ error() }}</div> }
      @if (success()) { <div class="ok">Pedido #{{ success() }} creado y enviado a cocina.</div> }

      <section class="card">
        <h3>Tipo</h3>
        <div class="chips">
          @for (t of types; track t.value) {
            <button type="button" class="chip" [class.active]="type() === t.value" (click)="setType(t.value)">
              {{ t.label }}
            </button>
          }
        </div>

        @if (type() === 'DINE_IN') {
          <label for="table">Mesa</label>
          <select id="table" [(ngModel)]="tableId" name="table">
            <option [ngValue]="null">— Selecciona —</option>
            @for (table of selectableTables(); track table.id) {
              <option [ngValue]="table.id">{{ table.name }}</option>
            }
          </select>
        }

        @if (type() === 'DELIVERY') {
          <label for="channel">Canal</label>
          <select id="channel" [(ngModel)]="channel" name="channel">
            <option value="LOCAL">Local</option>
            <option value="RAPPI">Rappi</option>
            <option value="DIDI">DiDi</option>
          </select>
          <label for="cname">Cliente</label>
          <input id="cname" name="cname" [(ngModel)]="customerName" />
          <label for="cphone">Teléfono</label>
          <input id="cphone" name="cphone" [(ngModel)]="customerPhone" />
          <label for="caddr">Dirección</label>
          <input id="caddr" name="caddr" [(ngModel)]="customerAddress" />
        }
      </section>

      <section class="card">
        <h3>Productos</h3>
        @if (loadingProducts()) {
          <p class="muted">Cargando catálogo…</p>
        } @else {
          <input
            class="search"
            placeholder="Buscar producto…"
            [ngModel]="searchSignal()"
            (ngModelChange)="searchSignal.set($event)"
            name="search"
          />
          <div class="product-list">
            @for (product of filteredProducts(); track product.id) {
              <button type="button" class="product" (click)="addToCart(product)">
                <span>{{ product.name }}</span>
                <span class="price">{{ formatPrice(product.price) }}</span>
              </button>
            }
          </div>
        }
      </section>

      <section class="card">
        <h3>Pedido ({{ cart().length }})</h3>
        @if (cart().length === 0) {
          <p class="muted">Agrega productos al pedido.</p>
        } @else {
          <ul class="cart">
            @for (line of cart(); track line.product.id) {
              <li>
                <span class="cname">{{ line.product.name }}</span>
                <span class="controls">
                  <button type="button" (click)="dec(line)">−</button>
                  <span class="qty">{{ line.qty }}</span>
                  <button type="button" (click)="inc(line)">+</button>
                </span>
                <span class="line-total">{{ formatPrice(line.product.price * line.qty) }}</span>
              </li>
            }
          </ul>
          <div class="total">
            <span>Total</span>
            <strong>{{ formatPrice(total()) }}</strong>
          </div>
        }
        <button
          type="button"
          class="submit"
          [disabled]="!canSubmit() || submitting()"
          (click)="submit()"
        >
          {{ submitting() ? 'Enviando…' : 'Enviar a cocina' }}
        </button>
      </section>
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
      .content { max-width: 720px; margin: 0 auto; padding: 1.5rem; }
      .muted { opacity: 0.75; }
      .card {
        background: var(--cf-surface); border-radius: 12px; padding: 1.1rem 1.3rem; margin-bottom: 1.2rem;
      }
      .card h3 { margin-top: 0; color: var(--cf-accent); }
      label { display: block; font-size: 0.85rem; margin: 0.6rem 0 0.3rem; }
      select, input {
        width: 100%; padding: 0.55rem 0.7rem; border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.15); background: rgba(0, 0, 0, 0.2); color: var(--cf-text);
      }
      .chips { display: flex; gap: 0.5rem; flex-wrap: wrap; }
      .chip {
        background: rgba(200, 134, 43, 0.12); border: 1px solid var(--cf-accent);
        color: var(--cf-text); border-radius: 999px; padding: 0.35rem 0.85rem; cursor: pointer;
      }
      .chip.active { background: var(--cf-accent); color: #1a120b; font-weight: 600; }
      .search { margin-bottom: 0.8rem; }
      .product-list { max-height: 280px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.4rem; }
      .product {
        display: flex; justify-content: space-between; align-items: center;
        background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.08);
        color: var(--cf-text); border-radius: 8px; padding: 0.55rem 0.8rem; cursor: pointer;
      }
      .product .price { color: var(--cf-accent); font-weight: 600; }
      .cart { list-style: none; margin: 0 0 0.8rem; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
      .cart li { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 0.8rem; }
      .controls { display: flex; align-items: center; gap: 0.5rem; }
      .controls button {
        width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--cf-accent);
        background: transparent; color: var(--cf-accent); cursor: pointer; font-size: 1rem; line-height: 1;
      }
      .qty { min-width: 1.5rem; text-align: center; }
      .line-total { color: var(--cf-accent); }
      .total { display: flex; justify-content: space-between; padding: 0.6rem 0; border-top: 1px solid rgba(255,255,255,0.1); font-size: 1.1rem; }
      .submit {
        width: 100%; margin-top: 0.8rem; background: var(--cf-accent); color: #1a120b;
        border: none; border-radius: 8px; padding: 0.8rem; font-weight: 700; cursor: pointer;
      }
      .submit:disabled { opacity: 0.5; cursor: not-allowed; }
      .alert {
        background: rgba(224, 122, 95, 0.15); border: 1px solid var(--cf-error);
        color: var(--cf-error); padding: 0.8rem 1rem; border-radius: 8px; margin-bottom: 1rem;
      }
      .ok {
        background: rgba(46, 125, 50, 0.18); border: 1px solid #2e7d32;
        color: #9ed99f; padding: 0.8rem 1rem; border-radius: 8px; margin-bottom: 1rem;
      }
    `,
  ],
})
export class OrderNewComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly ordersService = inject(OrdersService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly types: { value: OrderType; label: string }[] = [
    { value: 'DINE_IN', label: 'Mesa' },
    { value: 'DELIVERY', label: 'Domicilio' },
    { value: 'TAKEAWAY', label: 'Para llevar' },
  ];

  readonly type = signal<OrderType>('DINE_IN');
  tableId: number | null = null;
  channel: OrderChannel = 'LOCAL';
  customerName = '';
  customerPhone = '';
  customerAddress = '';
  search = '';

  readonly tables = signal<RestaurantTable[]>([]);
  readonly products = signal<Product[]>([]);
  readonly cart = signal<CartLine[]>([]);
  readonly loadingProducts = signal(true);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<number | null>(null);
  readonly searchSignal = signal('');

  readonly selectableTables = computed(() =>
    this.tables().filter((t) => t.kind === 'Mesa' || t.kind === 'Especial'),
  );

  readonly total = computed(() =>
    this.cart().reduce((sum, line) => sum + line.product.price * line.qty, 0),
  );

  readonly filteredProducts = computed(() => {
    const term = this.searchSignal().trim().toLowerCase();
    const all = this.products();
    if (!term) {
      return all;
    }
    return all.filter((p) => p.name.toLowerCase().includes(term));
  });

  ngOnInit(): void {
    const tableIdParam = this.route.snapshot.queryParamMap.get('tableId');
    if (tableIdParam) {
      this.type.set('DINE_IN');
      this.tableId = Number(tableIdParam);
    }

    this.ordersService.getTables().subscribe({
      next: (tables) => this.tables.set(tables),
      error: () => this.error.set('No se pudieron cargar las mesas.'),
    });

    this.catalog.getProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loadingProducts.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el catálogo.');
        this.loadingProducts.set(false);
      },
    });
  }

  setType(type: OrderType): void {
    this.type.set(type);
  }

  onSearch(): void {
    this.searchSignal.set(this.search);
  }

  addToCart(product: Product): void {
    const lines = [...this.cart()];
    const existing = lines.find((l) => l.product.id === product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      lines.push({ product, qty: 1 });
    }
    this.cart.set(lines);
  }

  inc(line: CartLine): void {
    this.cart.set(this.cart().map((l) => (l.product.id === line.product.id ? { ...l, qty: l.qty + 1 } : l)));
  }

  dec(line: CartLine): void {
    const updated = this.cart()
      .map((l) => (l.product.id === line.product.id ? { ...l, qty: l.qty - 1 } : l))
      .filter((l) => l.qty > 0);
    this.cart.set(updated);
  }

  canSubmit(): boolean {
    if (this.cart().length === 0) {
      return false;
    }
    if (this.type() === 'DINE_IN' && this.tableId == null) {
      return false;
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

  submit(): void {
    if (!this.canSubmit()) {
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    this.success.set(null);

    const request: CreateOrderRequest = {
      type: this.type(),
      channel: this.type() === 'DELIVERY' ? this.channel : 'LOCAL',
      tableId: this.type() === 'DINE_IN' ? this.tableId : null,
      customerName: this.customerName || null,
      customerPhone: this.customerPhone || null,
      customerAddress: this.customerAddress || null,
      items: this.cart().map((line) => ({
        productId: line.product.id,
        productName: line.product.name,
        unitPrice: line.product.price,
        quantity: line.qty,
      })),
    };

    this.ordersService.createOrder(request).subscribe({
      next: (order) => {
        this.submitting.set(false);
        this.success.set(order.id);
        this.cart.set([]);
      },
      error: () => {
        this.submitting.set(false);
        this.error.set('No se pudo crear el pedido.');
      },
    });
  }
}
