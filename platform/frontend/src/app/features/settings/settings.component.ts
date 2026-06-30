import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Settings, SettingsService, UpdateSettingsRequest } from '../../core/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <header class="topbar">
      <a routerLink="/" class="back">← Volver</a>
      <span class="brand">Configuración</span>
    </header>

    <main class="content">
      @if (error()) { <div class="alert">{{ error() }}</div> }
      @if (saved()) { <div class="ok">Cambios guardados correctamente.</div> }

      @if (loading()) {
        <p class="muted">Cargando…</p>
      } @else {
        <form (ngSubmit)="save()">
          <section class="card">
            <h3>Datos del negocio</h3>
            <label for="name">Nombre del negocio *</label>
            <input id="name" name="name" [(ngModel)]="form.restaurantName" required maxlength="160" />

            <div class="grid">
              <div>
                <label for="taxId">NIT / Identificación</label>
                <input id="taxId" name="taxId" [(ngModel)]="form.taxId" maxlength="40" />
              </div>
              <div>
                <label for="phone">Teléfono</label>
                <input id="phone" name="phone" [(ngModel)]="form.phone" maxlength="40" />
              </div>
            </div>

            <label for="address">Dirección</label>
            <input id="address" name="address" [(ngModel)]="form.address" maxlength="240" />

            <label for="email">Correo</label>
            <input id="email" name="email" type="email" [(ngModel)]="form.email" maxlength="120" />
          </section>

          <section class="card">
            <h3>Parámetros de venta</h3>
            <div class="grid">
              <div>
                <label for="currency">Moneda</label>
                <input id="currency" name="currency" [(ngModel)]="form.currency" required maxlength="8" />
              </div>
              <div>
                <label for="tax">Impuesto (%)</label>
                <input id="tax" name="tax" type="number" min="0" max="100" step="0.01" [(ngModel)]="form.taxRatePercent" />
              </div>
            </div>
            <div class="grid">
              <div>
                <label for="service">Cargo por servicio (%)</label>
                <input id="service" name="service" type="number" min="0" max="100" step="0.01" [(ngModel)]="form.serviceChargePercent" />
              </div>
              <div>
                <label for="tip">Propina sugerida (%)</label>
                <input id="tip" name="tip" type="number" min="0" max="100" step="0.01" [(ngModel)]="form.tipSuggestedPercent" />
              </div>
            </div>
            <label for="footer">Pie de recibo</label>
            <input id="footer" name="footer" [(ngModel)]="form.receiptFooter" maxlength="300" />
          </section>

          <section class="card">
            <h3>Impresión (pos-bridge)</h3>
            <label for="transport">Transporte</label>
            <select id="transport" name="transport" [(ngModel)]="form.printerTransport">
              <option value="noop">Ninguno (noop)</option>
              <option value="network">Red (network)</option>
            </select>

            <div class="grid">
              <div>
                <label for="rHost">Impresora caja — host</label>
                <input id="rHost" name="rHost" [(ngModel)]="form.receiptPrinterHost" maxlength="120" />
              </div>
              <div>
                <label for="rPort">Puerto</label>
                <input id="rPort" name="rPort" type="number" min="1" max="65535" [(ngModel)]="form.receiptPrinterPort" />
              </div>
            </div>
            <div class="grid">
              <div>
                <label for="kHost">Impresora cocina — host</label>
                <input id="kHost" name="kHost" [(ngModel)]="form.kitchenPrinterHost" maxlength="120" />
              </div>
              <div>
                <label for="kPort">Puerto</label>
                <input id="kPort" name="kPort" type="number" min="1" max="65535" [(ngModel)]="form.kitchenPrinterPort" />
              </div>
            </div>
          </section>

          <button type="submit" [disabled]="saving() || !form.restaurantName">
            {{ saving() ? 'Guardando…' : 'Guardar configuración' }}
          </button>

          @if (updatedInfo()) {
            <p class="muted small">Última actualización: {{ updatedInfo() }}</p>
          }
        </form>
      }
    </main>
  `,
  styles: [
    `
      .topbar { display: flex; align-items: center; gap: 1rem; padding: 0.9rem 1.5rem; background: var(--cf-surface); border-bottom: 1px solid rgba(0,0,0,0.3); }
      .back { color: var(--cf-text); text-decoration: none; opacity: 0.85; }
      .brand { color: var(--cf-accent); font-weight: 700; font-size: 1.1rem; }
      .content { max-width: 680px; margin: 0 auto; padding: 1.5rem; }
      .muted { opacity: 0.75; }
      .small { font-size: 0.8rem; }
      .card { background: var(--cf-surface); border-radius: 12px; padding: 1.1rem 1.3rem; margin-bottom: 1.2rem; }
      .card h3 { margin-top: 0; color: var(--cf-accent); }
      label { display: block; font-size: 0.85rem; margin: 0.6rem 0 0.3rem; }
      input, select { width: 100%; padding: 0.6rem 0.7rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(0,0,0,0.2); color: var(--cf-text); box-sizing: border-box; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
      button[type='submit'] { width: 100%; border: none; border-radius: 8px; padding: 0.8rem; font-weight: 700; cursor: pointer; background: var(--cf-accent); color: #1a120b; }
      button:disabled { opacity: 0.5; cursor: not-allowed; }
      .alert { background: rgba(224,122,95,0.15); border: 1px solid var(--cf-error); color: var(--cf-error); padding: 0.8rem 1rem; border-radius: 8px; margin-bottom: 1rem; }
      .ok { background: rgba(46,125,50,0.18); border: 1px solid #2e7d32; color: #7bd389; padding: 0.8rem 1rem; border-radius: 8px; margin-bottom: 1rem; }
      @media (max-width: 520px) { .grid { grid-template-columns: 1fr; } }
    `,
  ],
})
export class SettingsComponent implements OnInit {
  private readonly settingsService = inject(SettingsService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly saved = signal(false);
  readonly updatedInfo = signal<string | null>(null);

  form: UpdateSettingsRequest = this.emptyForm();

  ngOnInit(): void {
    this.settingsService.get().subscribe({
      next: (settings) => {
        this.apply(settings);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la configuración.');
        this.loading.set(false);
      },
    });
  }

  save(): void {
    if (!this.form.restaurantName) {
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.saved.set(false);
    this.settingsService.update(this.form).subscribe({
      next: (settings) => {
        this.apply(settings);
        this.saving.set(false);
        this.saved.set(true);
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.error.set(this.message(err, 'No se pudo guardar la configuración.'));
      },
    });
  }

  private apply(settings: Settings): void {
    this.form = {
      restaurantName: settings.restaurantName,
      taxId: settings.taxId,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      currency: settings.currency,
      taxRatePercent: settings.taxRatePercent,
      serviceChargePercent: settings.serviceChargePercent,
      tipSuggestedPercent: settings.tipSuggestedPercent,
      receiptFooter: settings.receiptFooter,
      printerTransport: settings.printerTransport,
      receiptPrinterHost: settings.receiptPrinterHost,
      receiptPrinterPort: settings.receiptPrinterPort,
      kitchenPrinterHost: settings.kitchenPrinterHost,
      kitchenPrinterPort: settings.kitchenPrinterPort,
    };
    if (settings.updatedBy || settings.updatedAt) {
      const when = new Date(settings.updatedAt).toLocaleString('es-CO');
      this.updatedInfo.set(settings.updatedBy ? `${settings.updatedBy} · ${when}` : when);
    }
  }

  private emptyForm(): UpdateSettingsRequest {
    return {
      restaurantName: '',
      taxId: null,
      address: null,
      phone: null,
      email: null,
      currency: 'COP',
      taxRatePercent: 0,
      serviceChargePercent: 0,
      tipSuggestedPercent: 0,
      receiptFooter: null,
      printerTransport: 'noop',
      receiptPrinterHost: null,
      receiptPrinterPort: null,
      kitchenPrinterHost: null,
      kitchenPrinterPort: null,
    };
  }

  private message(err: unknown, fallback: string): string {
    const apiError = err as { error?: { error?: string } };
    return apiError?.error?.error ?? fallback;
  }
}
