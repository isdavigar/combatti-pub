import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiKey, CreatedApiKey, IntegrationService } from '../../core/integration.service';

@Component({
  selector: 'app-integrations',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="section-header mb-3">
      <div>
        <h2 class="section-title"><i class="fa-solid fa-plug"></i> Integraciones (API)</h2>
        <p class="section-subtitle">API keys para integraciones externas.</p>
      </div>
    </div>

      @if (error()) { <div class="alert-banner mb-3"><i class="fa-solid fa-circle-exclamation"></i> {{ error() }}</div> }

      @if (createdKey(); as created) {
        <div class="secret-box mb-3">
          <h3>🔑 API key creada</h3>
          <p class="warn">Cópiala ahora: por seguridad no se volverá a mostrar.</p>
          <div class="secret">
            <code>{{ created.apiKey }}</code>
            <button type="button" (click)="copy(created.apiKey)">Copiar</button>
          </div>
          <p class="muted small">Úsala en el header <code>X-Api-Key</code> al llamar a <code>/api/integration/v1/**</code>.</p>
          <button type="button" class="ghost" (click)="dismissSecret()">Entendido</button>
        </div>
      }

      <section class="card">
        <h3>Nueva API key</h3>
        <label for="name">Nombre / descripción</label>
        <input id="name" name="name" [(ngModel)]="newName" placeholder="Ej: Tienda online" maxlength="120" />

        <p class="label">Permisos (scopes)</p>
        <div class="scopes">
          @for (s of availableScopes(); track s) {
            <label class="scope">
              <input type="checkbox" [checked]="isSelected(s)" (change)="toggleScope(s, $event)" />
              <span>{{ s }}</span>
            </label>
          }
        </div>

        <button type="button" [disabled]="creating() || !canCreate()" (click)="create()">
          {{ creating() ? 'Creando…' : 'Crear API key' }}
        </button>
      </section>

      <section class="card">
        <h3>API keys</h3>
        @if (loading()) {
          <p class="muted">Cargando…</p>
        } @else if (keys().length === 0) {
          <p class="muted">Aún no hay API keys.</p>
        } @else {
          <table>
            <thead>
              <tr><th>Nombre</th><th>Prefijo</th><th>Scopes</th><th>Estado</th><th>Último uso</th><th></th></tr>
            </thead>
            <tbody>
              @for (k of keys(); track k.id) {
                <tr [class.revoked]="!k.active">
                  <td>{{ k.name }}</td>
                  <td><code>{{ k.keyPrefix }}</code></td>
                  <td class="scopes-cell">{{ k.scopes.join(', ') }}</td>
                  <td>{{ k.active ? 'Activa' : 'Revocada' }}</td>
                  <td>{{ k.lastUsedAt ? formatDate(k.lastUsedAt) : '—' }}</td>
                  <td>
                    @if (k.active) {
                      <button type="button" class="danger" (click)="revoke(k)">Revocar</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .mb-3 { margin-bottom: 1rem; }
    .text-muted { color: var(--muted); }
    .section-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .alert-banner { background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.3); color: #dc2626; border-radius: 14px; padding: .75rem 1rem; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    .form-group { margin-bottom: .75rem; }
    .scopes { display: flex; flex-wrap: wrap; gap: .8rem; margin-bottom: .8rem; }
    .scope { display: flex; align-items: center; gap: .4rem; font-size: .9rem; }
    button.danger { background: var(--danger); color: #fff; padding: .4rem .7rem; font-size: .8rem; border-radius: 8px; border: 0; cursor: pointer; }
    button.ghost { background: transparent; color: var(--text); border: 1px solid var(--border); border-radius: 8px; padding: .4rem .7rem; cursor: pointer; }
    table { width: 100%; border-collapse: collapse; font-size: .9rem; }
    th, td { text-align: left; padding: .5rem .6rem; border-bottom: 1px solid var(--border); }
    .scopes-cell { font-size: .8rem; opacity: .9; }
    tr.revoked { opacity: .5; }
    .secret-box { background: rgba(25,195,125,.08); border: 1px solid rgba(25,195,125,.3); border-radius: 16px; padding: 1rem 1.2rem; }
    .secret-box h3 { margin-top: 0; color: var(--primary); }
      .warn { color: #ffcf6b; font-weight: 600; }
      .secret { display: flex; gap: 0.6rem; align-items: center; background: rgba(0,0,0,0.3); padding: 0.6rem 0.8rem; border-radius: 8px; }
      .secret code { word-break: break-all; flex: 1; }
    `,
  ],
})
export class IntegrationsComponent implements OnInit {
  private readonly integrationService = inject(IntegrationService);

  readonly loading = signal(true);
  readonly creating = signal(false);
  readonly error = signal<string | null>(null);
  readonly keys = signal<ApiKey[]>([]);
  readonly availableScopes = signal<string[]>([]);
  readonly createdKey = signal<CreatedApiKey | null>(null);

  newName = '';
  private selectedScopes = signal<string[]>([]);

  ngOnInit(): void {
    this.integrationService.scopes().subscribe({
      next: (scopes) => this.availableScopes.set(scopes),
      error: () => this.availableScopes.set(['catalog:read', 'orders:read', 'orders:write']),
    });
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.integrationService.list().subscribe({
      next: (keys) => {
        this.keys.set(keys);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las API keys.');
        this.loading.set(false);
      },
    });
  }

  isSelected(scope: string): boolean {
    return this.selectedScopes().includes(scope);
  }

  toggleScope(scope: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.selectedScopes();
    if (checked) {
      this.selectedScopes.set([...current, scope]);
    } else {
      this.selectedScopes.set(current.filter((s) => s !== scope));
    }
  }

  canCreate(): boolean {
    return this.newName.trim().length > 0 && this.selectedScopes().length > 0;
  }

  create(): void {
    if (!this.canCreate()) {
      return;
    }
    this.creating.set(true);
    this.error.set(null);
    this.integrationService
      .create({ name: this.newName.trim(), scopes: this.selectedScopes() })
      .subscribe({
        next: (created) => {
          this.createdKey.set(created);
          this.newName = '';
          this.selectedScopes.set([]);
          this.creating.set(false);
          this.reload();
        },
        error: (err: unknown) => {
          this.creating.set(false);
          this.error.set(this.message(err, 'No se pudo crear la API key.'));
        },
      });
  }

  revoke(key: ApiKey): void {
    this.integrationService.revoke(key.id).subscribe({
      next: () => this.reload(),
      error: () => this.error.set('No se pudo revocar la API key.'),
    });
  }

  dismissSecret(): void {
    this.createdKey.set(null);
  }

  copy(value: string): void {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(value);
    }
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString('es-CO');
  }

  private message(err: unknown, fallback: string): string {
    const apiError = err as { error?: { error?: string } };
    return apiError?.error?.error ?? fallback;
  }
}
