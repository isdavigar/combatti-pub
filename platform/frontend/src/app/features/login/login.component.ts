import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-screen">
      <div class="login-card">
        <div class="login-row">
          <!-- Left: form -->
          <div class="login-form-col">
            <div class="login-form-inner">
              <div class="text-center mb-4">
                <div class="brand-logo login-brand-logo">
                  <i class="fa-solid fa-utensils fa-2x"></i>
                </div>
                <h2 class="fw-bold mb-1">Combatti POS</h2>
                <p class="text-secondary">Sistema POS de restaurante</p>
              </div>

              @if (error()) {
                <div class="login-alert">
                  <i class="fa-solid fa-circle-exclamation"></i>
                  {{ error() }}
                </div>
              }

              <div class="form-group">
                <label class="form-label">Usuario</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="admin"
                  autocomplete="username"
                  autocapitalize="none"
                  spellcheck="false"
                  [(ngModel)]="username"
                  [disabled]="loading()"
                  (keydown.enter)="submit()"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Contraseña</label>
                <div class="login-pass-wrap">
                  <input
                    [type]="showPassword() ? 'text' : 'password'"
                    class="form-control"
                    placeholder="••••••••"
                    autocomplete="current-password"
                    [(ngModel)]="password"
                    [disabled]="loading()"
                    (keydown.enter)="submit()"
                  />
                  <button type="button" class="login-pass-toggle" (click)="togglePassword()">
                    <i [class]="showPassword() ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                  </button>
                </div>
              </div>

              <button
                class="btn btn-success btn-pill w-100 login-submit-btn"
                [disabled]="loading() || !username || !password"
                (click)="submit()"
              >
                {{ loading() ? 'Ingresando…' : 'Ingresar' }}
              </button>
            </div>
          </div>

          <!-- Right: illustration -->
          <div class="login-illustration-col">
            <div class="login-illustration">
              <div class="login-illustration-overlay">
                <h3>Bienvenido</h3>
                <p>Gestiona tu restaurante de forma profesional</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-screen {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background:
        linear-gradient(135deg, rgba(8,13,22,.68), rgba(8,13,22,.90)),
        url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop');
      background-position: center; background-size: cover; padding: 18px;
    }
    .login-card {
      width: min(100%, 980px);
      background: rgba(255,255,255,.96); color: #18212f;
      border-radius: 30px; padding: 22px;
      box-shadow: 0 30px 80px rgba(0,0,0,.28); overflow: hidden;
    }
    .login-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0; min-height: 560px; }
    .login-form-col { display: flex; align-items: center; padding: 1.5rem; }
    .login-form-inner { width: 100%; }
    .login-brand-logo {
      width: 76px; height: 76px; border-radius: 24px;
      display: inline-flex; align-items: center; justify-content: center;
      margin-bottom: 12px;
    }
    .text-center { text-align: center; }
    .text-secondary { color: #6b7280; }
    .mb-4 { margin-bottom: 1.5rem; }
    .mb-1 { margin-bottom: .25rem; }
    h2 { margin: 0 0 4px; font-size: 1.5rem; }
    p { margin: 0; }
    .form-group { margin-bottom: 1rem; }
    .form-label { display: block; font-weight: 600; margin-bottom: .35rem; color: #374151; font-size: .9rem; }
    .form-control {
      width: 100%; border-radius: 16px; padding: .9rem 1rem;
      border: 1px solid #e5e7eb; background: #ffffff; color: #18212f;
      font-size: .95rem;
    }
    .form-control::placeholder { color: #9ca3af; }
    .form-control:focus {
      outline: none;
      border-color: rgba(25,195,125,.55);
      box-shadow: 0 0 0 .2rem rgba(25,195,125,.18);
    }
    .login-pass-wrap { position: relative; }
    .login-pass-wrap .form-control { padding-right: 3.1rem; }
    .login-pass-toggle {
      position: absolute; top: 50%; right: .5rem; transform: translateY(-50%);
      border: 0; background: transparent; color: #6b7280;
      width: 2.3rem; height: 2.3rem; border-radius: 12px; cursor: pointer;
      display: flex; align-items: center; justify-content: center; transition: .2s;
    }
    .login-pass-toggle:hover { color: var(--primary); background: rgba(25,195,125,.12); }
    .login-submit-btn { margin-top: .5rem; padding: .9rem; font-size: 1rem; font-weight: 800; }
    .login-alert {
      background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.3);
      color: #dc2626; border-radius: 14px; padding: .75rem 1rem; margin-bottom: 1rem;
      font-size: .9rem; display: flex; align-items: center; gap: 8px;
    }
    .login-illustration-col { padding: .75rem; display: flex; }
    .login-illustration {
      flex: 1; border-radius: 24px;
      background: url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop') center/cover no-repeat;
      position: relative; overflow: hidden; min-height: 430px;
    }
    .login-illustration::after {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.58));
      border-radius: 24px;
    }
    .login-illustration-overlay {
      position: absolute; bottom: 0; left: 0; right: 0; z-index: 1;
      color: #fff; padding: 24px;
    }
    .login-illustration-overlay h3 { font-size: 1.4rem; font-weight: 900; margin: 0 0 4px; }
    .login-illustration-overlay p { opacity: .85; margin: 0; font-size: .95rem; }

    @media (max-width: 991px) {
      .login-illustration-col { display: none; }
      .login-row { grid-template-columns: 1fr; }
    }
    @media (max-width: 575px) {
      .login-screen { padding: 12px; align-items: flex-start; padding-top: 40px; }
      .login-card { padding: 14px; border-radius: 24px; }
      .login-form-col { padding: 1rem; }
    }
  `],
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  username = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showPassword = signal(false);

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  submit(): void {
    if (!this.username || !this.password) return;
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
    if (apiError?.error?.error) return apiError.error.error;
    if (apiError?.status === 0) return 'No se pudo conectar con el servidor.';
    return 'No fue posible iniciar sesión. Verifica tus credenciales.';
  }
}
