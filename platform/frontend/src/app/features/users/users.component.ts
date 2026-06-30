import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Role, UserSummary, UsersService } from '../../core/users.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <header class="topbar">
      <a routerLink="/" class="back">← Volver</a>
      <span class="brand">Usuarios</span>
    </header>

    <main class="content">
      @if (error()) { <div class="alert">{{ error() }}</div> }
      @if (success()) { <div class="ok">{{ success() }}</div> }

      <section class="card">
        <h3>Nuevo usuario</h3>
        <div class="form-grid">
          <input placeholder="Usuario" [ngModel]="newUsername()" (ngModelChange)="newUsername.set($event)" name="u" />
          <input placeholder="Nombre" [ngModel]="newDisplayName()" (ngModelChange)="newDisplayName.set($event)" name="n" />
          <input placeholder="Contraseña" type="password" [ngModel]="newPassword()" (ngModelChange)="newPassword.set($event)" name="p" />
          <select [ngModel]="newRole()" (ngModelChange)="newRole.set($event)" name="r">
            @for (role of roles(); track role.id) {
              <option [value]="role.name">{{ role.name }}</option>
            }
          </select>
          <button type="button" [disabled]="!canCreate() || saving()" (click)="create()">
            {{ saving() ? 'Creando…' : 'Crear' }}
          </button>
        </div>
      </section>

      <section class="card">
        <h3>Usuarios ({{ users().length }})</h3>
        @if (loading()) {
          <p class="muted">Cargando…</p>
        } @else {
          <table class="users">
            <thead>
              <tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr [class.disabled]="!user.enabled">
                  <td>{{ user.username }}</td>
                  <td>{{ user.displayName }}</td>
                  <td>
                    <select
                      [ngModel]="user.roles[0]"
                      (ngModelChange)="changeRole(user, $event)"
                      [attr.name]="'role-' + user.id"
                    >
                      @for (role of roles(); track role.id) {
                        <option [value]="role.name">{{ role.name }}</option>
                      }
                    </select>
                  </td>
                  <td>
                    <span class="badge" [class.on]="user.enabled">
                      {{ user.enabled ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="actions">
                    <button type="button" (click)="toggleEnabled(user)">
                      {{ user.enabled ? 'Desactivar' : 'Activar' }}
                    </button>
                    <button type="button" (click)="resetPassword(user)">Clave</button>
                    <button type="button" class="danger" (click)="remove(user)">Eliminar</button>
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
      .content { max-width: 920px; margin: 0 auto; padding: 1.5rem; }
      .muted { opacity: 0.75; }
      .card { background: var(--cf-surface); border-radius: 12px; padding: 1.1rem 1.3rem; margin-bottom: 1.2rem; }
      .card h3 { margin-top: 0; color: var(--cf-accent); }
      .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.6rem; align-items: center; }
      input, select { padding: 0.5rem 0.6rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(0,0,0,0.2); color: var(--cf-text); }
      button { border: 1px solid var(--cf-accent); background: transparent; color: var(--cf-accent); border-radius: 8px; padding: 0.45rem 0.7rem; cursor: pointer; }
      .form-grid button { background: var(--cf-accent); color: #1a120b; font-weight: 700; border: none; }
      button.danger { border-color: var(--cf-error); color: var(--cf-error); }
      table.users { width: 100%; border-collapse: collapse; }
      table.users th, table.users td { text-align: left; padding: 0.5rem 0.4rem; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 0.9rem; }
      tr.disabled { opacity: 0.55; }
      .badge { font-size: 0.75rem; padding: 0.15rem 0.5rem; border-radius: 999px; background: rgba(224,122,95,0.2); border: 1px solid var(--cf-error); }
      .badge.on { background: rgba(46,125,50,0.2); border-color: #2e7d32; color: #9ed99f; }
      .actions { display: flex; gap: 0.4rem; flex-wrap: wrap; }
      .alert { background: rgba(224,122,95,0.15); border: 1px solid var(--cf-error); color: var(--cf-error); padding: 0.8rem 1rem; border-radius: 8px; margin-bottom: 1rem; }
      .ok { background: rgba(46,125,50,0.18); border: 1px solid #2e7d32; color: #9ed99f; padding: 0.8rem 1rem; border-radius: 8px; margin-bottom: 1rem; }
    `,
  ],
})
export class UsersComponent implements OnInit {
  private readonly usersService = inject(UsersService);

  readonly users = signal<UserSummary[]>([]);
  readonly roles = signal<Role[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  readonly newUsername = signal('');
  readonly newDisplayName = signal('');
  readonly newPassword = signal('');
  readonly newRole = signal('');

  ngOnInit(): void {
    this.usersService.listRoles().subscribe({
      next: (roles) => {
        this.roles.set(roles);
        if (roles.length > 0) {
          this.newRole.set(roles[0].name);
        }
      },
      error: () => this.error.set('No se pudieron cargar los roles.'),
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.usersService.listUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los usuarios.');
        this.loading.set(false);
      },
    });
  }

  canCreate(): boolean {
    return (
      this.newUsername().trim().length >= 3 &&
      this.newDisplayName().trim().length > 0 &&
      this.newPassword().length >= 6 &&
      this.newRole().length > 0
    );
  }

  create(): void {
    if (!this.canCreate()) {
      return;
    }
    this.saving.set(true);
    this.clearMessages();
    this.usersService
      .createUser({
        username: this.newUsername().trim(),
        displayName: this.newDisplayName().trim(),
        password: this.newPassword(),
        roles: [this.newRole()],
        enabled: true,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.success.set('Usuario creado.');
          this.newUsername.set('');
          this.newDisplayName.set('');
          this.newPassword.set('');
          this.load();
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.error.set(this.message(err, 'No se pudo crear el usuario.'));
        },
      });
  }

  changeRole(user: UserSummary, role: string): void {
    this.update(user, { displayName: user.displayName, roles: [role], enabled: user.enabled }, 'Rol actualizado.');
  }

  toggleEnabled(user: UserSummary): void {
    this.update(
      user,
      { displayName: user.displayName, roles: user.roles, enabled: !user.enabled },
      user.enabled ? 'Usuario desactivado.' : 'Usuario activado.',
    );
  }

  resetPassword(user: UserSummary): void {
    const pwd = window.prompt(`Nueva contraseña para ${user.username} (mín. 6 caracteres):`);
    if (!pwd) {
      return;
    }
    if (pwd.length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    this.clearMessages();
    this.usersService.resetPassword(user.id, pwd).subscribe({
      next: () => this.success.set(`Contraseña de ${user.username} actualizada.`),
      error: (err: unknown) => this.error.set(this.message(err, 'No se pudo actualizar la contraseña.')),
    });
  }

  remove(user: UserSummary): void {
    if (!window.confirm(`¿Eliminar al usuario ${user.username}?`)) {
      return;
    }
    this.clearMessages();
    this.usersService.deleteUser(user.id).subscribe({
      next: () => {
        this.success.set('Usuario eliminado.');
        this.load();
      },
      error: (err: unknown) => this.error.set(this.message(err, 'No se pudo eliminar el usuario.')),
    });
  }

  private update(user: UserSummary, request: { displayName: string; roles: string[]; enabled: boolean }, ok: string): void {
    this.clearMessages();
    this.usersService.updateUser(user.id, request).subscribe({
      next: () => {
        this.success.set(ok);
        this.load();
      },
      error: (err: unknown) => this.error.set(this.message(err, 'No se pudo actualizar el usuario.')),
    });
  }

  private clearMessages(): void {
    this.error.set(null);
    this.success.set(null);
  }

  private message(err: unknown, fallback: string): string {
    const apiError = err as { error?: { error?: string } };
    return apiError?.error?.error ?? fallback;
  }
}
