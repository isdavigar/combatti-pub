import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Settings, SettingsService, UpdateSettingsRequest } from '../../core/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="section-header mb-3">
      <div>
        <h2 class="section-title"><i class="fa-solid fa-gear"></i> Configuración</h2>
        <p class="section-subtitle">Datos del negocio y parámetros de venta.</p>
      </div>
    </div>

    @if (error()) { <div class="alert-banner mb-3"><i class="fa-solid fa-circle-exclamation"></i> {{ error() }}</div> }
    @if (saved()) { <div class="success-banner mb-3"><i class="fa-solid fa-check-circle"></i> Cambios guardados correctamente.</div> }

      @if (loading()) {
        <div class="glass-card" style="min-height:200px;display:grid;place-items:center"><span class="text-muted">Cargando…</span></div>
      } @else {
        <form (ngSubmit)="save()">
          <section class="glass-card mb-3">
            <h3 class="section-title mb-2">Datos del negocio</h3>
            <div class="form-group"><label class="form-label">Nombre del negocio *</label>
            <input class="form-control" id="name" name="name" [(ngModel)]="form.restaurantName" required maxlength="160" /></div>

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
    </form>
      }
  `,
  styles: [`
    :host { display: block; }
    .mb-2 { margin-bottom: .5rem; }
    .mb-3 { margin-bottom: 1rem; }
    .text-muted { color: var(--muted); }
    .section-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .alert-banner { background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.3); color: #dc2626; border-radius: 14px; padding: .75rem 1rem; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    .success-banner { background: rgba(25,195,125,.08); border: 1px solid rgba(25,195,125,.3); color: var(--primary); border-radius: 14px; padding: .75rem 1rem; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    .form-group { margin-bottom: .75rem; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    button[type='submit'] { width: 100%; margin-top: 1rem; }
    @media (max-width: 520px) { .grid { grid-template-columns: 1fr; } }
  `],
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
