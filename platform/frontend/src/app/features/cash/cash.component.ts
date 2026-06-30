import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CashService, CashSession, MovementType } from '../../core/cash.service';

@Component({
  selector: 'app-cash',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <header class="topbar">
      <a routerLink="/" class="back">← Volver</a>
      <span class="brand">Caja</span>
    </header>

    <main class="content">
      @if (error()) { <div class="alert">{{ error() }}</div> }

      @if (loading()) {
        <p class="muted">Cargando…</p>
      } @else if (session(); as s) {
        <section class="card">
          <div class="head">
            <h3>Caja abierta</h3>
            <span class="by">por {{ s.openedBy }}</span>
          </div>
          <div class="rows">
            <div class="row"><span>Fondo inicial</span><strong>{{ money(s.openingAmount) }}</strong></div>
            <div class="row"><span>Ingresos</span><strong>{{ money(s.totalIncome) }}</strong></div>
            <div class="row"><span>Egresos</span><strong>{{ money(s.totalExpense) }}</strong></div>
            <div class="row total"><span>Saldo esperado</span><strong>{{ money(s.balance) }}</strong></div>
          </div>
        </section>

        <section class="card">
          <h3>Registrar movimiento</h3>
          <div class="chips">
            <button type="button" class="chip" [class.active]="movementType() === 'INCOME'" (click)="movementType.set('INCOME')">Ingreso</button>
            <button type="button" class="chip" [class.active]="movementType() === 'EXPENSE'" (click)="movementType.set('EXPENSE')">Egreso</button>
          </div>
          <label for="mamount">Monto</label>
          <input id="mamount" type="number" min="0" [ngModel]="movementAmount()" (ngModelChange)="movementAmount.set($event)" name="mamount" />
          <label for="mconcept">Concepto</label>
          <input id="mconcept" [ngModel]="movementConcept()" (ngModelChange)="movementConcept.set($event)" name="mconcept" />
          <button type="button" class="secondary" [disabled]="!movementAmount() || savingMovement()" (click)="submitMovement()">
            {{ savingMovement() ? 'Guardando…' : 'Agregar movimiento' }}
          </button>

          @if (s.movements.length > 0) {
            <ul class="movs">
              @for (m of s.movements; track m.id) {
                <li>
                  <span class="mtype" [class.exp]="m.type === 'EXPENSE'">{{ m.type === 'INCOME' ? '+' : '−' }}</span>
                  <span class="mconcept">{{ m.concept || (m.type === 'INCOME' ? 'Ingreso' : 'Egreso') }}</span>
                  <span class="mamount">{{ money(m.amount) }}</span>
                </li>
              }
            </ul>
          }
        </section>

        <section class="card">
          <h3>Cerrar caja (arqueo)</h3>
          <label for="counted">Efectivo contado</label>
          <input id="counted" type="number" min="0" [ngModel]="countedCash()" (ngModelChange)="countedCash.set($event)" name="counted" />
          <div class="row" [class.neg]="difference() < 0">
            <span>Diferencia (contado − esperado)</span>
            <strong>{{ money(difference()) }}</strong>
          </div>
          <button type="button" class="danger" [disabled]="countedCash() === null || closing()" (click)="submitClose(s)">
            {{ closing() ? 'Cerrando…' : 'Cerrar caja' }}
          </button>
        </section>
      } @else {
        @if (lastClosed(); as closed) {
          <section class="card summary">
            <h3>Caja cerrada</h3>
            <div class="rows">
              <div class="row"><span>Esperado</span><strong>{{ money(closed.expectedCash) }}</strong></div>
              <div class="row"><span>Contado</span><strong>{{ money(closed.countedCash) }}</strong></div>
              <div class="row total" [class.neg]="(closed.difference ?? 0) < 0">
                <span>Diferencia</span><strong>{{ money(closed.difference) }}</strong>
              </div>
            </div>
          </section>
        }
        <section class="card">
          <h3>Abrir caja</h3>
          <label for="opening">Fondo inicial</label>
          <input id="opening" type="number" min="0" [ngModel]="openingAmount()" (ngModelChange)="openingAmount.set($event)" name="opening" />
          <button type="button" [disabled]="openingAmount() === null || opening()" (click)="submitOpen()">
            {{ opening() ? 'Abriendo…' : 'Abrir caja' }}
          </button>
        </section>
      }
    </main>
  `,
  styles: [
    `
      .topbar { display: flex; align-items: center; gap: 1rem; padding: 0.9rem 1.5rem; background: var(--cf-surface); border-bottom: 1px solid rgba(0,0,0,0.3); }
      .back { color: var(--cf-text); text-decoration: none; opacity: 0.85; }
      .brand { color: var(--cf-accent); font-weight: 700; font-size: 1.1rem; }
      .content { max-width: 620px; margin: 0 auto; padding: 1.5rem; }
      .muted { opacity: 0.75; }
      .card { background: var(--cf-surface); border-radius: 12px; padding: 1.1rem 1.3rem; margin-bottom: 1.2rem; }
      .card h3 { margin-top: 0; color: var(--cf-accent); }
      .head { display: flex; justify-content: space-between; align-items: baseline; }
      .by { opacity: 0.7; font-size: 0.85rem; }
      .rows { display: flex; flex-direction: column; gap: 0.4rem; }
      .row { display: flex; justify-content: space-between; padding: 0.3rem 0; }
      .row.total { border-top: 1px solid rgba(255,255,255,0.12); margin-top: 0.3rem; padding-top: 0.6rem; font-size: 1.1rem; }
      .row.neg strong, .neg strong { color: var(--cf-error); }
      label { display: block; font-size: 0.85rem; margin: 0.6rem 0 0.3rem; }
      input { width: 100%; padding: 0.6rem 0.7rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(0,0,0,0.2); color: var(--cf-text); }
      .chips { display: flex; gap: 0.5rem; }
      .chip { background: rgba(200,134,43,0.12); border: 1px solid var(--cf-accent); color: var(--cf-text); border-radius: 999px; padding: 0.35rem 0.9rem; cursor: pointer; }
      .chip.active { background: var(--cf-accent); color: #1a120b; font-weight: 600; }
      button { margin-top: 0.9rem; width: 100%; border: none; border-radius: 8px; padding: 0.75rem; font-weight: 700; cursor: pointer; background: var(--cf-accent); color: #1a120b; }
      button.secondary { background: transparent; border: 1px solid var(--cf-accent); color: var(--cf-accent); }
      button.danger { background: #c0392b; color: #fff; }
      button:disabled { opacity: 0.5; cursor: not-allowed; }
      .movs { list-style: none; margin: 1rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 0.35rem; }
      .movs li { display: grid; grid-template-columns: auto 1fr auto; gap: 0.6rem; align-items: center; }
      .mtype { color: #2e7d32; font-weight: 700; }
      .mtype.exp { color: var(--cf-error); }
      .summary { border: 1px solid var(--cf-accent); }
      .alert { background: rgba(224,122,95,0.15); border: 1px solid var(--cf-error); color: var(--cf-error); padding: 0.8rem 1rem; border-radius: 8px; margin-bottom: 1rem; }
    `,
  ],
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
    if (!s || counted == null) {
      return 0;
    }
    return counted - s.balance;
  });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.cashService.getCurrent().subscribe({
      next: (session) => {
        this.session.set(session);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la caja.');
        this.loading.set(false);
      },
    });
  }

  money(value: number | null): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value ?? 0);
  }

  submitOpen(): void {
    const amount = this.openingAmount();
    if (amount == null) {
      return;
    }
    this.opening.set(true);
    this.error.set(null);
    this.cashService.open(amount).subscribe({
      next: (session) => {
        this.opening.set(false);
        this.lastClosed.set(null);
        this.openingAmount.set(null);
        this.session.set(session);
      },
      error: (err: unknown) => {
        this.opening.set(false);
        this.error.set(this.message(err, 'No se pudo abrir la caja.'));
      },
    });
  }

  submitMovement(): void {
    const amount = this.movementAmount();
    if (amount == null || amount <= 0) {
      return;
    }
    this.savingMovement.set(true);
    this.error.set(null);
    this.cashService.addMovement(this.movementType(), amount, this.movementConcept() || undefined).subscribe({
      next: (session) => {
        this.savingMovement.set(false);
        this.session.set(session);
        this.movementAmount.set(null);
        this.movementConcept.set('');
      },
      error: (err: unknown) => {
        this.savingMovement.set(false);
        this.error.set(this.message(err, 'No se pudo registrar el movimiento.'));
      },
    });
  }

  submitClose(current: CashSession): void {
    const counted = this.countedCash();
    if (counted == null) {
      return;
    }
    this.closing.set(true);
    this.error.set(null);
    this.cashService.close(counted).subscribe({
      next: (closed) => {
        this.closing.set(false);
        this.lastClosed.set(closed);
        this.session.set(null);
        this.countedCash.set(null);
      },
      error: (err: unknown) => {
        this.closing.set(false);
        this.error.set(this.message(err, 'No se pudo cerrar la caja.'));
      },
    });
  }

  private message(err: unknown, fallback: string): string {
    const apiError = err as { error?: { error?: string } };
    return apiError?.error?.error ?? fallback;
  }
}
