import { Component, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { ReportingService } from '../../core/reporting.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  template: `
    <!-- Hero section -->
    <div class="dashboard-hero mb-4">
      <div class="dashboard-hero-main">
        <span class="dashboard-hero-eyebrow">
          <i class="fa-solid fa-bolt"></i>
          <span>Operación de hoy</span>
        </span>
        <h2 class="dashboard-title">Bienvenido, {{ user()?.displayName }}</h2>
        <p class="dashboard-hero-lead">Resumen en vivo de tu restaurante: ventas, pedidos y estado de caja.</p>
        <div class="dashboard-hero-metrics">
          <div>
            <span><i class="fa-solid fa-sack-dollar"></i> Ventas hoy</span>
            <strong>{{ salesToday() }}</strong>
          </div>
          <div>
            <span><i class="fa-solid fa-bowl-food"></i> Pedidos activos</span>
            <strong>{{ activeOrders() }}</strong>
          </div>
          <div>
            <span><i class="fa-solid fa-cash-register"></i> Caja estimada</span>
            <strong>{{ cashValue() }}</strong>
          </div>
        </div>
      </div>
      <div class="dashboard-side-panel">
        <div class="dashboard-quick-panel">
          <div class="dashboard-filter-title">
            <i class="fa-solid fa-circle-info"></i>
            <span>Resumen</span>
          </div>
          <div class="quick-info">
            <div class="quick-info-row">
              <span><i class="fa-solid fa-clock"></i> Hora</span>
              <strong>{{ now() }}</strong>
            </div>
            <div class="quick-info-row">
              <span><i class="fa-solid fa-calendar"></i> Fecha</span>
              <strong>{{ today() }}</strong>
            </div>
            <div class="quick-info-row">
              <span><i class="fa-solid fa-user"></i> Usuario</span>
              <strong>{{ user()?.displayName }}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- KPI cards row -->
    <div class="kpi-row mb-4">
      <div class="kpi-card goal-kpi">
        <div class="goal-ring" [attr.data-label]="goalTodayPct()" [style.--goal-progress]="goalTodayPct()">
        </div>
        <div class="goal-copy">
          <div class="stat-value">{{ salesToday() }}</div>
          <div class="stat-label">Facturado HOY</div>
        </div>
      </div>
      <div class="kpi-card goal-kpi">
        <div class="goal-ring" [attr.data-label]="'—'" [style.--goal-progress]="'0%'">
        </div>
        <div class="goal-copy">
          <div class="stat-value">$0</div>
          <div class="stat-label">Últimos 7 días</div>
        </div>
      </div>
      <div class="kpi-card goal-kpi">
        <div class="goal-ring" [attr.data-label]="'—'" [style.--goal-progress]="'0%'">
        </div>
        <div class="goal-copy">
          <div class="stat-value">$0</div>
          <div class="stat-label">Últimos 30 días</div>
        </div>
      </div>
      <div class="kpi-card goal-kpi">
        <div class="goal-ring" [attr.data-label]="'—'" [style.--goal-progress]="'0%'">
        </div>
        <div class="goal-copy">
          <div class="stat-value">$0</div>
          <div class="stat-label">Año actual</div>
        </div>
      </div>
    </div>

    <!-- Charts row -->
    <div class="charts-row mb-4">
      <div class="chart-box chart-tall">
        <div class="chart-head">
          <div>
            <h5 class="section-title">Ventas por período</h5>
            <p class="section-subtitle">Ventas cobradas (gráfico de barras).</p>
          </div>
          <div class="chart-kpis">
            <div class="chart-kpi"><span>Promedio</span><strong>$0</strong></div>
            <div class="chart-kpi"><span>Mejor día</span><strong>$0</strong></div>
          </div>
        </div>
        <div class="chart-placeholder">
          <i class="fa-solid fa-chart-column"></i>
          <span>Gráfico de ventas (conectar backend)</span>
        </div>
      </div>
      <div class="chart-box pie">
        <div class="chart-head">
          <div>
            <h5 class="section-title">Métodos de pago</h5>
            <p class="section-subtitle">Uso por ventas.</p>
          </div>
        </div>
        <div class="chart-placeholder">
          <i class="fa-solid fa-chart-pie"></i>
          <span>Gráfico de métodos (conectar backend)</span>
        </div>
      </div>
    </div>

    <!-- Second charts row -->
    <div class="charts-row-2 mb-4">
      <div class="chart-box">
        <div class="chart-head">
          <div>
            <h5 class="section-title">Ingresos vs gastos</h5>
            <p class="section-subtitle">Barras comparativas por período.</p>
          </div>
        </div>
        <div class="chart-placeholder">
          <i class="fa-solid fa-scale-balanced"></i>
          <span>Gráfico comparativo (conectar backend)</span>
        </div>
      </div>
      <div class="chart-box pie">
        <div class="chart-head">
          <div>
            <h5 class="section-title">Productos más vendidos</h5>
            <p class="section-subtitle">Participación por cantidad vendida.</p>
          </div>
        </div>
        <div class="chart-placeholder">
          <i class="fa-solid fa-ranking-star"></i>
          <span>Top productos (conectar backend)</span>
        </div>
      </div>
    </div>

    <!-- Session info / permissions -->
    <div class="glass-card mb-4">
      <h4 class="section-title mb-2">Permisos efectivos</h4>
      <div class="chips">
        @for (perm of user()?.permissions ?? []; track perm) {
          <span class="badge-soft">{{ perm }}</span>
        } @empty {
          <span class="text-muted">Sin permisos asignados.</span>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .mb-4 { margin-bottom: 1.5rem; }

    /* KPI row */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
    }
    .goal-kpi {
      align-items: center; gap: 16px; min-height: 132px;
    }
    .goal-ring {
      width: 84px; height: 84px; border-radius: 50%; flex: 0 0 84px;
      background: conic-gradient(var(--primary) var(--goal-progress, 0%), rgba(148,163,184,.20) 0);
      position: relative; isolation: isolate;
    }
    .goal-ring::after {
      content: ''; position: absolute; inset: 8px; border-radius: 50%;
      background: var(--card); box-shadow: inset 0 0 0 1px var(--border);
    }
    .goal-ring::before {
      content: attr(data-label); position: absolute; inset: 0; z-index: 1;
      display: flex; align-items: center; justify-content: center;
      font-size: .92rem; font-weight: 900; color: var(--primary);
    }
    .goal-copy { min-width: 0; flex: 1; text-align: right; }
    .goal-copy .stat-value { font-size: 1.2rem; color: var(--primary); }
    .goal-copy .stat-label { color: var(--muted); font-size: .82rem; }

    /* Charts grid */
    .charts-row {
      display: grid; grid-template-columns: 2fr 1fr; gap: 16px;
    }
    .charts-row-2 {
      display: grid; grid-template-columns: 5fr 7fr; gap: 16px;
    }
    .chart-placeholder {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 12px; min-height: 280px; color: var(--muted); font-size: .9rem;
      border: 1px dashed var(--border); border-radius: 16px;
      background: rgba(148,163,184,.04);
    }
    .chart-placeholder i { font-size: 2.5rem; opacity: .4; }

    h5 { margin: 0 0 4px; }
    p { margin: 0; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .text-muted { color: var(--muted); }
    .quick-info { display: flex; flex-direction: column; gap: 8px; }
    .quick-info-row {
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
      border: 1px solid rgba(255,255,255,.16); border-radius: 14px;
      padding: 10px 12px; background: rgba(255,255,255,.08);
    }
    .quick-info-row span { display: flex; align-items: center; gap: 7px; color: rgba(255,255,255,.8); font-size: .8rem; font-weight: 700; }
    .quick-info-row strong { color: #fff; font-size: .9rem; }

    @media (max-width: 992px) {
      .kpi-row { grid-template-columns: repeat(2, 1fr); }
      .charts-row, .charts-row-2 { grid-template-columns: 1fr; }
    }
    @media (max-width: 576px) {
      .kpi-row { grid-template-columns: 1fr; }
    }
  `],
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly reporting = inject(ReportingService);

  readonly user = this.auth.user;
  readonly salesToday = signal('$0');
  readonly activeOrders = signal('0');
  readonly cashValue = signal('$0');
  readonly goalTodayPct = signal('0%');
  readonly now = signal('--:--');
  readonly today = signal('');

  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.loadSalesData();
    this.updateClock();
    this.timer = setInterval(() => this.updateClock(), 1000);
  }

  private updateClock(): void {
    const d = new Date();
    this.now.set(d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }));
    this.today.set(d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }));
  }

  private loadSalesData(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.reporting.getSales(today, today).subscribe({
      next: (data) => {
        const total = data?.total ?? 0;
        this.salesToday.set(this.formatCurrency(total));
      },
      error: () => { /* silently fail, keep $0 */ },
    });
  }

  private formatCurrency(value: number): string {
    return '$' + value.toLocaleString('es-CO', { minimumFractionDigits: 0 });
  }
}
