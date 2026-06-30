import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-wrapper">
      <form class="login-card" (ngSubmit)="submit()">
        <h1 class="brand">Combatti POS</h1>
        <p class="subtitle">Inicia sesión para continuar</p>

        @if (error()) {
          <div class="alert">{{ error() }}</div>
        }

        <label for="username">Usuario</label>
        <input
          id="username"
          name="username"
          type="text"
          autocomplete="username"
          [(ngModel)]="username"
          [disabled]="loading()"
          required
        />

        <label for="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          autocomplete="current-password"
          [(ngModel)]="password"
          [disabled]="loading()"
          required
        />

        <button type="submit" [disabled]="loading() || !username || !password">
          {{ loading() ? 'Ingresando…' : 'Ingresar' }}
        </button>
      </form>
    </div>
  `,
  styles: [
    `
      .login-wrapper {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
      }
      .login-card {
        width: 100%;
        max-width: 360px;
        background: var(--cf-surface);
        padding: 2rem;
        border-radius: 14px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
        display: flex;
        flex-direction: column;
      }
      .brand {
        margin: 0;
        color: var(--cf-accent);
        text-align: center;
      }
      .subtitle {
        margin: 0.25rem 0 1.5rem;
        text-align: center;
        opacity: 0.8;
      }
      label {
        font-size: 0.85rem;
        margin-bottom: 0.35rem;
      }
      input {
        margin-bottom: 1rem;
        padding: 0.7rem 0.8rem;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        background: rgba(0, 0, 0, 0.2);
        color: var(--cf-text);
        font-size: 1rem;
      }
      button {
        margin-top: 0.5rem;
        padding: 0.8rem;
        border: none;
        border-radius: 8px;
        background: var(--cf-accent);
        color: #1a120b;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
      }
      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .alert {
        background: rgba(224, 122, 95, 0.15);
        border: 1px solid var(--cf-error);
        color: var(--cf-error);
        padding: 0.6rem 0.8rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        font-size: 0.9rem;
      }
    `,
  ],
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  username = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  submit(): void {
    if (!this.username || !this.password) {
      return;
    }
    this.error.set(null);
    this.loading.set(true);

    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigateByUrl('/');
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(this.extractMessage(err));
      },
    });
  }

  private extractMessage(err: unknown): string {
    const apiError = err as { error?: { error?: string }; status?: number };
    if (apiError?.error?.error) {
      return apiError.error.error;
    }
    if (apiError?.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }
    return 'No fue posible iniciar sesión. Verifica tus credenciales.';
  }
}
