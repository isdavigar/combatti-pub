import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { OrdersService, RestaurantTable } from '../../core/orders.service';
import { RealtimeService } from '../../core/realtime.service';

@Component({
  selector: 'app-tables',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="topbar">
      <a routerLink="/" class="back">← Volver</a>
      <span class="brand">Mesas</span>
      <a routerLink="/orders/new" class="new">+ Nuevo pedido</a>
    </header>

    <main class="content">
      @if (loading()) {
        <p class="muted">Cargando mesas…</p>
      } @else if (error()) {
        <div class="alert">{{ error() }}</div>
      } @else {
        <div class="grid">
          @for (table of tables(); track table.id) {
            <button
              type="button"
              class="table-card"
              [class.occupied]="table.occupied"
              (click)="onTableClick(table)"
            >
              <span class="name">{{ table.name }}</span>
              <span class="kind">{{ table.kind }}</span>
              <span class="status">{{ table.occupied ? 'Ocupada' : 'Libre' }}</span>
            </button>
          }
        </div>
      }
    </main>
  `,
  styles: [
    `
      .topbar {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.9rem 1.5rem;
        background: var(--cf-surface);
        border-bottom: 1px solid rgba(0, 0, 0, 0.3);
      }
      .back { color: var(--cf-text); text-decoration: none; opacity: 0.85; }
      .brand { color: var(--cf-accent); font-weight: 700; font-size: 1.1rem; }
      .new {
        margin-left: auto;
        color: #1a120b;
        background: var(--cf-accent);
        padding: 0.45rem 0.9rem;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
      }
      .content { max-width: 1000px; margin: 0 auto; padding: 1.5rem; }
      .muted { opacity: 0.75; }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 1rem;
      }
      .table-card {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        align-items: flex-start;
        background: var(--cf-surface);
        border: 2px solid #2e7d32;
        border-radius: 12px;
        padding: 1rem;
        cursor: pointer;
        color: var(--cf-text);
        text-align: left;
      }
      .table-card.occupied { border-color: var(--cf-error); }
      .name { font-weight: 700; }
      .kind { font-size: 0.72rem; text-transform: uppercase; opacity: 0.6; }
      .status { font-size: 0.8rem; }
      .table-card.occupied .status { color: var(--cf-error); }
      .alert {
        background: rgba(224, 122, 95, 0.15);
        border: 1px solid var(--cf-error);
        color: var(--cf-error);
        padding: 0.8rem 1rem;
        border-radius: 8px;
      }
    `,
  ],
})
export class TablesComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly router = inject(Router);
  private readonly realtime = inject(RealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  readonly tables = signal<RestaurantTable[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.reload();
    this.realtime.connect();
    this.realtime.orderEvents$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reload());
  }

  private reload(): void {
    this.ordersService.getTables().subscribe({
      next: (tables) => {
        this.tables.set(tables);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las mesas.');
        this.loading.set(false);
      },
    });
  }

  onTableClick(table: RestaurantTable): void {
    if (table.kind === 'Mesa' || table.kind === 'Especial') {
      void this.router.navigate(['/orders/new'], { queryParams: { tableId: table.id } });
    }
  }
}
