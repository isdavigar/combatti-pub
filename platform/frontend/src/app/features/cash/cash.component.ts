import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CashService, CashSession, MovementType } from '../../core/cash.service';

@Component({
  selector: 'app-cash',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="section-header mb-3">
      <div>
        <h2 class="section-title"><i class="fa-solid fa-cash-register"></i> Caja</h2>
        <p class="section-subtitle">Gestión de apertura, movimientos y cierre de caja.</p>
      </div>
    </div>

    @if (error()) {
      <div class="alert-banner mb-3"><i class="fa-solid fa-circle-exclamation"></i> {{ error() }}</div>
    }

    @if (loading()) {
      <div class="glass-card" style="min-height:200px;display:grid;place-items:center">
        <span class="text-muted">Cargando caja…</span>
      </div>
    } @else {
      <div class="cash-layout">
        <!-- Left column -->
        <div class="cash-left">
          @if (session(); as s) {
            <!-- Cash open badge -->
            <div class="cash-open-badge mb-3">
              <i class="fa-solid fa-lock-open"></i> CAJA ABIERTA por {{ s.openedBy }}
            </div>

            <!-- Summary -->
            <div class="glass-card mb-3">
              <h4 class="section-title mb-2">Resumen</h4>
              <div class="cash-summary-grid">
                <div class="mini-table"><span>Fondo inicial</span><strong>{{ money(s.openingAmount) }}</strong></div>
                <div class="mini-table"><span>Ingresos</span><strong class="text-success">{{ money(s.totalIncome) }}</strong></div>
                <div class="mini-table"><span>Egresos</span><strong class="text-danger">{{ money(s.totalExpense) }}</strong></div>
                <div class="mini-table cash-balance-row"><span>Saldo esperado</span><strong>{{ money(s.balance) }}</strong></div>
              </div>
            </div>

            <!-- Movements -->
            <div class="glass-card mb-3">
              <h4 class="section-title mb-2">Registrar movimiento</h4>
              <div class="d-flex gap-2 mb-2">
                <button class="category-chip" [class.active]="movementType() === 'INCOME'" (click)="movementType.set('INCOME')">
                  <i class="fa-solid fa-arrow-down"></i> Ingreso
                </button>
                <button class="category-chip" [class.active]="movementType() === 'EXPENSE'" (click)="movementType.set('EXPENSE')">
                  <i class="fa-solid fa-arrow-up"></i> Egreso
                </button>
              </div>
              <div class="form-group"><label class="form-label">Monto</label>
                <input type="number" class="form-control" min="0" [ngModel]="movementAmount()" (ngModelChange)="movementAmount.set($event)" />
              </div>
              <div class="form-group"><label class="form-label">Concepto</label>
                <input class="form-control" [ngModel]="movementConcept()" (ngModelChange)="movementConcept.set($event)" placeholder="Opcional" />
              </div>
              <button class="btn btn-success btn-pill w-100 mt-2" [disabled]="!movementAmount() || savingMovement()" (click)="submitMovement()">
                {{ savingMovement() ? 'Guardando…' : 'Agregar movimiento' }}
              </button>

              @if (s.movements.length > 0) {
                <div class="metric-list mt-3">
                  @for (m of s.movements; track m.id) {
                    <div class="metric-row">
                      <span>
                        <i [class]="m.type === 'INCOME' ? 'fa-solid fa-arrow-down text-success' : 'fa-solid fa-arrow-up text-danger'"></i>
                        {{ m.concept || (m.type === 'INCOME' ? 'Ingreso' : 'Egreso') }}
                      </span>
                      <strong [class.text-success]="m.type === 'INCOME'" [class.text-danger]="m.type === 'EXPENSE'">
                        {{ money(m.amount) }}
                      </strong>
                    </div>
                  }
                </div>
              }
            </div>
          } @else {
            @if (lastClosed(); as closed) {
              <div class="cash-closed-banner mb-3">
                <i class="fa-solid fa-lock"></i> La caja está cerrada.
              </div>
              <div class="glass-card mb-3">
                <h4 class="section-title mb-2">Último cierre</h4>
                <div class="close-cash-summary">
                  <div class="close-cash-card"><span><i class="fa-solid fa-coins"></i> Esperado</span><strong>{{ money(closed.expectedCash) }}</strong></div>
                  <div class="close-cash-card"><span><i class="fa-solid fa-hand-holding-dollar"></i> Contado</span><strong>{{ money(closed.countedCash) }}</strong></div>
                  <div class="close-cash-card highlight"><span><i class="fa-solid fa-scale-balanced"></i> Diferencia</span><strong>{{ money(closed.difference) }}</strong></div>
                </div>
              </div>
            }
            <div class="glass-card">
              <h4 class="section-title mb-2">Abrir caja</h4>
              <div class="form-group"><label class="form-label">Fondo inicial</label>
                <input type="number" class="form-control" min="0" [ngModel]="openingAmount()" (ngModelChange)="openingAmount.set($event)" placeholder="0" />
              </div>
              <button class="btn btn-success btn-pill w-100 mt-2" [disabled]="openingAmount() === null || opening()" (click)="submitOpen()">
                <i class="fa-solid fa-lock-open"></i> {{ opening() ? 'Abriendo…' : 'Abrir caja' }}
              </button>
            </div>
          }
        </div>

        <!-- Right column: close -->
        <div class="cash-right">
          @if (session(); as s) {
            <div class="glass-card">
              <h4 class="section-title mb-2"><i class="fa-solid fa-lock"></i> Cerrar caja (Arqueo)</h4>
              <div class="form-group"><label class="form-label">Efectivo contado en caja</label>
                <input type="number" class="form-control" min="0" [ngModel]="countedCash()" (ngModelChange)="countedCash.set($event)" placeholder="0" />
              </div>
              <div class="close-discrepancy mt-2" [class.ok]="difference() >= 0" [class.bad]="difference() < 0" [class.neutral]="countedCash() === null">
                <span>Diferencia</span>
                <strong>{{ money(difference()) }}</strong>
              </div>
              <button class="btn btn-danger btn-pill w-100 mt-3" [disabled]="countedCash() === null || closing()" (click)="submitClose(s)">
                <i class="fa-solid fa-lock"></i> {{ closing() ? 'Cerrando…' : 'Cerrar caja' }}
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .mb-2 { margin-bottom: .5rem; }
    .mb-3 { margin-bottom: 1rem; }
    .mt-2 { margin-top: .5rem; }
    .mt-3 { margin-top: 1rem; }
    .w-100 { width: 100%; }
    .d-flex { display: flex; }
    .gap-2 { gap: 8px; }
    .form-group { margin-bottom: .75rem; }
    .section-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .alert-banner { background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.3); color: #dc2626; border-radius: 14px; padding: .75rem 1rem; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    .text-muted { color: var(--muted); }
    .cash-layout { display: grid; grid-template-columns: 1.1fr .9fr; gap: 18px; align-items: start; }
    .text-success { color: var(--primary) !important; }
    .text-danger { color: var(--danger) !important; }
    .btn-danger { background: #dc2626; border-color: #dc2626; color: #fff; }
    .close-discrepancy { padding: 12px 16px; border: 1px solid var(--border); border-radius: 16px; }
    .close-discrepancy span { font-size: .78rem; font-weight: 700; color: var(--muted); display: block; }
    .close-discrepancy strong { font-size: 1.5rem; font-weight: 900; display: block; margin-top: 4px; }
    .close-discrepancy.neutral { background: rgba(148,163,184,.08); }
    .close-discrepancy.ok { background: rgba(34,197,94,.12); border-color: rgba(34,197,94,.4); }
    .close-discrepancy.ok strong { color: #16a34a; }
    .close-discrepancy.bad { background: rgba(239,68,68,.12); border-color: rgba(239,68,68,.4); }
    .close-discrepancy.bad strong { color: #dc2626; }
    @media (max-width: 992px) { .cash-layout { grid-template-columns: 1fr; } }
  `],
})
export class CashComponent implements OnInit {
  private readonly cashService = inject(CashService);

  readonly session = signal<CashSession | null>(null);
  readonly lastClosed = signal<CashSession | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly openingAmount = signal<number | null>(null);
  readonly opening = signal(false);
  readonly movementType = signal<MovementType>('INCOME');
  readonly movementAmount = signal<number | null>(null);
  readonly movementConcept = signal<string>('');
  readonly savingMovement = signal(false);
  readonly countedCash = signal<number | null>(null);
  readonly closing = signal(false);

  readonly difference = computed(() => {
    const s = this.session();
    const counted = this.countedCash();
    if (!s || counted == null) return 0;
    return counted - s.balance;
  });

  ngOnInit(): void { this.reload(); }

  reload(): void {
    this.loading.set(true);
    this.cashService.getCurrent().subscribe({
      next: (session) => { this.session.set(session); this.loading.set(false); },
      error: () => { this.error.set('No se pudo cargar la caja.'); this.loading.set(false); },
    });
  }

  money(value: number | null): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value ?? 0);
  }

  submitOpen(): void {
    const amount = this.openingAmount();
    if (amount == null) return;
    this.opening.set(true); this.error.set(null);
    this.cashService.open(amount).subscribe({
      next: (session) => { this.opening.set(false); this.lastClosed.set(null); this.openingAmount.set(null); this.session.set(session); },
      error: (err: unknown) => { this.opening.set(false); this.error.set(this.msg(err, 'No se pudo abrir la caja.')); },
    });
  }

  submitMovement(): void {
    const amount = this.movementAmount();
    if (amount == null || amount <= 0) return;
    this.savingMovement.set(true); this.error.set(null);
    this.cashService.addMovement(this.movementType(), amount, this.movementConcept() || undefined).subscribe({
      next: (session) => { this.savingMovement.set(false); this.session.set(session); this.movementAmount.set(null); this.movementConcept.set(''); },
      error: (err: unknown) => { this.savingMovement.set(false); this.error.set(this.msg(err, 'No se pudo registrar el movimiento.')); },
    });
  }

  submitClose(current: CashSession): void {
    const counted = this.countedCash();
    if (counted == null) return;
    this.closing.set(true); this.error.set(null);
    this.cashService.close(counted).subscribe({
      next: (closed) => { this.closing.set(false); this.lastClosed.set(closed); this.session.set(null); this.countedCash.set(null); },
      error: (err: unknown) => { this.closing.set(false); this.error.set(this.msg(err, 'No se pudo cerrar la caja.')); },
    });
  }

  private msg(err: unknown, fallback: string): string {
    const e = err as { error?: { error?: string } };
    return e?.error?.error ?? fallback;
  }
}
