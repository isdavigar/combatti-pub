import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="topbar">
      <span class="brand">Combatti POS</span>
      <div class="user-box">
        <span>{{ user()?.displayName }}</span>
        <button type="button" (click)="logout()">Salir</button>
      </div>
    </header>

    <main class="content">
      <h2>Bienvenido, {{ user()?.displayName }}</h2>
      <p class="muted">
        Has iniciado sesión correctamente. Esta es la base (Fase 0) de la nueva
        plataforma. Los módulos del POS se irán habilitando en las siguientes fases.
      </p>

      <section class="card">
        <h3>Módulos</h3>
        <div class="modules">
          <a routerLink="/tables" class="module-link">🪑 Mesas</a>
          <a routerLink="/orders/new" class="module-link">🧾 Nuevo pedido</a>
          <a routerLink="/kitchen" class="module-link">👨‍🍳 Cocina</a>
          <a routerLink="/checkout" class="module-link">💵 Cobrar</a>
          <a routerLink="/cash" class="module-link">🧰 Caja</a>
          <a routerLink="/reports" class="module-link">📊 Reportes</a>
          <a routerLink="/menu" class="module-link">🍽️ Menú / Catálogo</a>
        </div>
      </section>

      <section class="card">
        <h3>Tu sesión</h3>
        <ul>
          <li><strong>Usuario:</strong> {{ user()?.username }}</li>
          <li><strong>Tenant:</strong> {{ user()?.tenantId }}</li>
          <li><strong>Roles:</strong> {{ (user()?.roles ?? []).join(', ') }}</li>
        </ul>
      </section>

      <section class="card">
        <h3>Permisos efectivos</h3>
        <div class="chips">
          @for (perm of user()?.permissions ?? []; track perm) {
            <span class="chip">{{ perm }}</span>
          } @empty {
            <span class="muted">Sin permisos asignados.</span>
          }
        </div>
      </section>
    </main>
  `,
  styles: [
    `
      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.9rem 1.5rem;
        background: var(--cf-surface);
        border-bottom: 1px solid rgba(0, 0, 0, 0.3);
      }
      .brand {
        color: var(--cf-accent);
        font-weight: 700;
        font-size: 1.1rem;
      }
      .user-box {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .user-box button {
        background: transparent;
        border: 1px solid var(--cf-accent);
        color: var(--cf-accent);
        padding: 0.4rem 0.9rem;
        border-radius: 8px;
        cursor: pointer;
      }
      .content {
        max-width: 760px;
        margin: 0 auto;
        padding: 2rem 1.5rem;
      }
      .muted {
        opacity: 0.75;
      }
      .card {
        background: var(--cf-surface);
        border-radius: 12px;
        padding: 1.2rem 1.4rem;
        margin-top: 1.2rem;
      }
      .card h3 {
        margin-top: 0;
        color: var(--cf-accent);
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .chip {
        background: rgba(200, 134, 43, 0.18);
        border: 1px solid var(--cf-accent);
        border-radius: 999px;
        padding: 0.25rem 0.7rem;
        font-size: 0.8rem;
      }
      .modules {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      .module-link {
        display: inline-block;
        background: rgba(200, 134, 43, 0.12);
        border: 1px solid var(--cf-accent);
        border-radius: 10px;
        padding: 0.7rem 1.1rem;
        color: var(--cf-text);
        text-decoration: none;
        font-weight: 600;
      }
      .module-link:hover {
        background: var(--cf-accent);
        color: #1a120b;
      }
    `,
  ],
})
export class DashboardComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.auth.user;

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
