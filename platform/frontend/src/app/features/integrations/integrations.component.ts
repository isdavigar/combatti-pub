import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiKey, CreatedApiKey, IntegrationService } from '../../core/integration.service';

@Component({
  selector: 'app-integrations',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <header class="topbar">
      <a routerLink="/" class="back">← Volver</a>
      <span class="brand">Integraciones (API)</span>
    </header>

    <main class="content">
      @if (error()) { <div class="alert">{{ error() }}</div> }

      @if (createdKey(); as created) {
        <div class="secret-box">
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
    </main>
  `,
  styles: [
    `
      .topbar { display: flex; align-items: center; gap: 1rem; padding: 0.9rem 1.5rem; background: var(--cf-surface); border-bottom: 1px solid rgba(0,0,0,0.3); }
      .back { color: var(--cf-text); text-decoration: none; opacity: 0.85; }
      .brand { color: var(--cf-accent); font-weight: 700; font-size: 1.1rem; }
      .content { max-width: 860px; margin: 0 auto; padding: 1.5rem; }
      .muted { opacity: 0.75; }
      .small { font-size: 0.8rem; }
      .card { background: var(--cf-surface); border-radius: 12px; padding: 1.1rem 1.3rem; margin-bottom: 1.2rem; }
      .card h3 { margin-top: 0; color: var(--cf-accent); }
      label, .label { display: block; font-size: 0.85rem; margin: 0.6rem 0 0.3rem; }
      input[type='text'], input#name { width: 100%; padding: 0.6rem 0.7rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(0,0,0,0.2); color: var(--cf-text); box-sizing: border-box; }
      .scopes { display: flex; flex-wrap: wrap; gap: 0.8rem; margin-bottom: 0.8rem; }
      .scope { display: flex; align-items: center; gap: 0.4rem; font-size: 0.9rem; }
      button { border: none; border-radius: 8px; padding: 0.6rem 1rem; font-weight: 700; cursor: pointer; background: var(--cf-accent); color: #1a120b; }
      button:disabled { opacity: 0.5; cursor: not-allowed; }
      button.danger { background: var(--cf-error); color: #fff; padding: 0.4rem 0.7rem; font-size: 0.8rem; }
      button.ghost { background: transparent; color: var(--cf-text); border: 1px solid rgba(255,255,255,0.25); }
      table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
      th, td { text-align: left; padding: 0.5rem 0.6rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
      .scopes-cell { font-size: 0.8rem; opacity: 0.9; }
      tr.revoked { opacity: 0.5; }
      .alert { background: rgba(224,122,95,0.15); border: 1px solid var(--cf-error); color: var(--cf-error); padding: 0.8rem 1rem; border-radius: 8px; margin-bottom: 1rem; }
      .secret-box { background: rgba(46,125,50,0.15); border: 1px solid #2e7d32; border-radius: 12px; padding: 1rem 1.2rem; margin-bottom: 1.2rem; }
      .secret-box h3 { margin-top: 0; }
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
