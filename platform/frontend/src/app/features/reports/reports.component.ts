import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ReportingService, SalesReport, TopProduct, CategorySales } from '../../core/reporting.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="section-header mb-3">
      <div>
        <h2 class="section-title"><i class="fa-solid fa-chart-column"></i> Reportes</h2>
        <p class="section-subtitle">Consulta de ventas, productos y métodos de pago.</p>
      </div>
    </div>

    @if (error()) { <div class="alert-banner mb-3"><i class="fa-solid fa-circle-exclamation"></i> {{ error() }}</div> }

    <!-- Filters -->
    <div class="glass-card mb-3">
      <div class="filter-row">
        <div class="filter-field">
          <label class="form-label">Desde</label>
          <input type="date" class="form-control" [ngModel]="from()" (ngModelChange)="from.set($event)" />
        </div>
        <div class="filter-field">
          <label class="form-label">Hasta</label>
          <input type="date" class="form-control" [ngModel]="to()" (ngModelChange)="to.set($event)" />
        </div>
        <button class="btn btn-success btn-pill" (click)="load()"><i class="fa-solid fa-search"></i> Consultar</button>
      </div>
    </div>

    @if (loading()) {
      <div class="glass-card" style="min-height:200px;display:grid;place-items:center"><span class="text-muted">Cargando…</span></div>
    } @else if (sales()) {
      <!-- KPIs -->
      <div class="kpi-grid mb-3">
        <div class="kpi-card"><div><div class="stat-value">{{ money(sales()!.total) }}</div><div class="stat-label">Ventas totales</div></div><div class="stat-icon"><i class="fa-solid fa-sack-dollar"></i></div></div>
        <div class="kpi-card"><div><div class="stat-value">{{ sales()!.transactions }}</div><div class="stat-label">Transacciones</div></div><div class="stat-icon"><i class="fa-solid fa-receipt"></i></div></div>
        <div class="kpi-card"><div><div class="stat-value">{{ money(sales()!.averageTicket) }}</div><div class="stat-label">Ticket promedio</div></div><div class="stat-icon"><i class="fa-solid fa-ticket"></i></div></div>
      </div>

      <!-- By method -->
      <div class="glass-card mb-3">
        <h4 class="section-title mb-2">Por método de pago</h4>
        @if (sales()!.byMethod.length === 0) { <p class="text-muted">Sin ventas en el periodo.</p> }
        @else {
          <div class="metric-list">
            @for (m of sales()!.byMethod; track m.method) {
              <div class="metric-row"><span>{{ methodLabel(m.method) }} <small class="text-muted">({{ m.count }})</small></span><strong>{{ money(m.total) }}</strong></div>
            }
          </div>
        }
      </div>

      <!-- Top products -->
      <div class="glass-card mb-3">
        <h4 class="section-title mb-2">Productos más vendidos</h4>
        @if (topProducts().length === 0) { <p class="text-muted">Sin productos vendidos en el periodo.</p> }
        @else {
          <div class="metric-list">
            @for (p of topProducts(); track p.productName) {
              <div class="metric-row"><span>{{ p.productName }} <small class="text-muted">×{{ p.quantity }}</small></span><strong>{{ money(p.revenue) }}</strong></div>
            }
          </div>
        }
      </div>

      <!-- By category -->
      <div class="glass-card mb-3">
        <h4 class="section-title mb-2">Ventas por categoría</h4>
        @if (categories().length === 0) { <p class="text-muted">Sin datos en el periodo.</p> }
        @else {
          <div class="metric-list">
            @for (c of categories(); track c.category) {
              <div class="metric-row"><span>{{ c.category }} <small class="text-muted">×{{ c.quantity }}</small></span><strong>{{ money(c.revenue) }}</strong></div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .mb-2 { margin-bottom: .5rem; }
    .mb-3 { margin-bottom: 1rem; }
    .text-muted { color: var(--muted); }
    .section-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .alert-banner { background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.3); color: #dc2626; border-radius: 14px; padding: .75rem 1rem; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    .filter-row { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
    .filter-field { display: flex; flex-direction: column; min-width: 160px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 16px; }
    @media (max-width: 768px) { .kpi-grid { grid-template-columns: 1fr; } }
  `],
})
export class ReportsComponent implements OnInit {
  private readonly reporting = inject(ReportingService);

  readonly from = signal<string>('');
  readonly to = signal<string>('');
  readonly sales = signal<SalesReport | null>(null);
  readonly topProducts = signal<TopProduct[]>([]);
  readonly categories = signal<CategorySales[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.from.set(today); this.to.set(today); this.load();
  }

  load(): void {
    this.loading.set(true); this.error.set(null);
    const from = this.from() || undefined;
    const to = this.to() || undefined;
    this.reporting.getSales(from, to).subscribe({
      next: (sales) => {
        this.sales.set(sales);
        this.reporting.getByCategory(from, to).subscribe({ next: (c) => this.categories.set(c), error: () => this.categories.set([]) });
        this.reporting.getTopProducts(from, to).subscribe({ next: (p) => { this.topProducts.set(p); this.loading.set(false); }, error: () => { this.topProducts.set([]); this.loading.set(false); } });
      },
      error: () => { this.error.set('No se pudieron cargar los reportes.'); this.loading.set(false); },
    });
  }

  money(value: number): string { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value); }

  methodLabel(method: string): string {
    const labels: Record<string, string> = { CASH: 'Efectivo', NEQUI: 'Nequi', BANCOLOMBIA: 'Bancolombia', BOLD: 'Bold', BREB: 'Bre-B', MIXED: 'Mixto' };
    return labels[method] ?? method;
  }
}
