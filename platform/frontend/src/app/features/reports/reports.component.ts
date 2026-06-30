import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ReportingService, SalesReport, TopProduct } from '../../core/reporting.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <header class="topbar">
      <a routerLink="/" class="back">← Volver</a>
      <span class="brand">Reportes</span>
    </header>

    <main class="content">
      @if (error()) { <div class="alert">{{ error() }}</div> }

      <section class="card filters">
        <div class="field">
          <label for="from">Desde</label>
          <input id="from" type="date" [ngModel]="from()" (ngModelChange)="from.set($event)" name="from" />
        </div>
        <div class="field">
          <label for="to">Hasta</label>
          <input id="to" type="date" [ngModel]="to()" (ngModelChange)="to.set($event)" name="to" />
        </div>
        <button type="button" (click)="load()">Consultar</button>
      </section>

      @if (loading()) {
        <p class="muted">Cargando…</p>
      } @else if (sales(); as s) {
        <section class="cards">
          <div class="kpi">
            <span class="kpi-label">Ventas</span>
            <span class="kpi-value">{{ money(s.total) }}</span>
          </div>
          <div class="kpi">
            <span class="kpi-label">Transacciones</span>
            <span class="kpi-value">{{ s.transactions }}</span>
          </div>
          <div class="kpi">
            <span class="kpi-label">Ticket promedio</span>
            <span class="kpi-value">{{ money(s.averageTicket) }}</span>
          </div>
        </section>

        <section class="card">
          <h3>Por método de pago</h3>
          @if (s.byMethod.length === 0) {
            <p class="muted">Sin ventas en el periodo.</p>
          } @else {
            <ul class="list">
              @for (m of s.byMethod; track m.method) {
                <li>
                  <span>{{ methodLabel(m.method) }}</span>
                  <span class="qty">{{ m.count }}</span>
                  <strong>{{ money(m.total) }}</strong>
                </li>
              }
            </ul>
          }
        </section>

        <section class="card">
          <h3>Productos más vendidos</h3>
          @if (topProducts().length === 0) {
            <p class="muted">Sin productos vendidos (pedidos cobrados) en el periodo.</p>
          } @else {
            <ul class="list">
              @for (p of topProducts(); track p.productName) {
                <li>
                  <span>{{ p.productName }}</span>
                  <span class="qty">{{ p.quantity }}</span>
                  <strong>{{ money(p.revenue) }}</strong>
                </li>
              }
            </ul>
          }
        </section>
      }
    </main>
  `,
  styles: [
    `
      .topbar { display: flex; align-items: center; gap: 1rem; padding: 0.9rem 1.5rem; background: var(--cf-surface); border-bottom: 1px solid rgba(0,0,0,0.3); }
      .back { color: var(--cf-text); text-decoration: none; opacity: 0.85; }
      .brand { color: var(--cf-accent); font-weight: 700; font-size: 1.1rem; }
      .content { max-width: 820px; margin: 0 auto; padding: 1.5rem; }
      .muted { opacity: 0.75; }
      .card { background: var(--cf-surface); border-radius: 12px; padding: 1.1rem 1.3rem; margin-bottom: 1.2rem; }
      .card h3 { margin-top: 0; color: var(--cf-accent); }
      .filters { display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap; }
      .field { display: flex; flex-direction: column; }
      label { font-size: 0.8rem; margin-bottom: 0.3rem; }
      input { padding: 0.5rem 0.6rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(0,0,0,0.2); color: var(--cf-text); }
      .filters button { background: var(--cf-accent); color: #1a120b; border: none; border-radius: 8px; padding: 0.55rem 1.1rem; font-weight: 700; cursor: pointer; }
      .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.2rem; }
      .kpi { background: var(--cf-surface); border-radius: 12px; padding: 1.1rem 1.3rem; display: flex; flex-direction: column; gap: 0.3rem; }
      .kpi-label { font-size: 0.8rem; opacity: 0.7; text-transform: uppercase; }
      .kpi-value { font-size: 1.5rem; font-weight: 700; color: var(--cf-accent); }
      .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.45rem; }
      .list li { display: grid; grid-template-columns: 1fr auto auto; gap: 1rem; align-items: center; }
      .list .qty { opacity: 0.65; }
      .alert { background: rgba(224,122,95,0.15); border: 1px solid var(--cf-error); color: var(--cf-error); padding: 0.8rem 1rem; border-radius: 8px; margin-bottom: 1rem; }
    `,
  ],
})
export class ReportsComponent implements OnInit {
  private readonly reporting = inject(ReportingService);

  readonly from = signal<string>('');
  readonly to = signal<string>('');
  readonly sales = signal<SalesReport | null>(null);
  readonly topProducts = signal<TopProduct[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.from.set(today);
    this.to.set(today);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const from = this.from() || undefined;
    const to = this.to() || undefined;

    this.reporting.getSales(from, to).subscribe({
      next: (sales) => {
        this.sales.set(sales);
        this.reporting.getTopProducts(from, to).subscribe({
          next: (products) => {
            this.topProducts.set(products);
            this.loading.set(false);
          },
          error: () => {
            this.topProducts.set([]);
            this.loading.set(false);
          },
        });
      },
      error: () => {
        this.error.set('No se pudieron cargar los reportes.');
        this.loading.set(false);
      },
    });
  }

  money(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  methodLabel(method: string): string {
    const labels: Record<string, string> = {
      CASH: 'Efectivo',
      NEQUI: 'Nequi',
      BANCOLOMBIA: 'Bancolombia',
      BOLD: 'Bold',
      BREB: 'Bre-B',
      MIXED: 'Mixto',
    };
    return labels[method] ?? method;
  }
}
