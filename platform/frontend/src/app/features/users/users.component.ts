import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Role, UserSummary, UsersService } from '../../core/users.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="section-header mb-3">
      <div>
        <h2 class="section-title"><i class="fa-solid fa-users"></i> Usuarios</h2>
        <p class="section-subtitle">Gestión de usuarios, roles y permisos.</p>
      </div>
    </div>

    @if (error()) { <div class="alert-banner mb-3"><i class="fa-solid fa-circle-exclamation"></i> {{ error() }}</div> }
    @if (success()) { <div class="success-banner mb-3"><i class="fa-solid fa-check-circle"></i> {{ success() }}</div> }

      <section class="glass-card mb-3">
        <h3 class="section-title mb-2">Nuevo usuario</h3>
        <div class="form-grid">
          <input class="form-control" placeholder="Usuario" [ngModel]="newUsername()" (ngModelChange)="newUsername.set($event)" name="u" />
          <input class="form-control" placeholder="Nombre" [ngModel]="newDisplayName()" (ngModelChange)="newDisplayName.set($event)" name="n" />
          <input class="form-control" placeholder="Contraseña" type="password" [ngModel]="newPassword()" (ngModelChange)="newPassword.set($event)" name="p" />
          <select class="form-control" [ngModel]="newRole()" (ngModelChange)="newRole.set($event)" name="r">
            @for (role of roles(); track role.id) {
              <option [value]="role.name">{{ role.name }}</option>
            }
          </select>
          <button class="btn btn-success btn-pill" [disabled]="!canCreate() || saving()" (click)="create()">
            {{ saving() ? 'Creando…' : 'Crear' }}
          </button>
        </div>
      </section>

      <section class="glass-card">
        <h3 class="section-title mb-2">Usuarios ({{ users().length }})</h3>
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
  `,
  styles: [`
    :host { display: block; }
    .mb-2 { margin-bottom: .5rem; }
    .mb-3 { margin-bottom: 1rem; }
    .section-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .alert-banner { background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.3); color: #dc2626; border-radius: 14px; padding: .75rem 1rem; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    .success-banner { background: rgba(25,195,125,.08); border: 1px solid rgba(25,195,125,.3); color: var(--primary); border-radius: 14px; padding: .75rem 1rem; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; align-items: center; }
    table.users { width: 100%; border-collapse: collapse; }
    table.users th, table.users td { text-align: left; padding: .6rem .5rem; border-bottom: 1px solid var(--border); font-size: .9rem; }
    table.users select { padding: .4rem .5rem; border-radius: 8px; border: 1px solid var(--border); background: var(--card); color: var(--text); }
    tr.disabled { opacity: .55; }
    .badge { font-size: .75rem; padding: .2rem .55rem; border-radius: 999px; background: rgba(239,68,68,.12); border: 1px solid var(--danger); color: var(--danger); }
    .badge.on { background: rgba(var(--primary-rgb),.12); border-color: var(--primary); color: var(--primary); }
    .actions { display: flex; gap: 6px; flex-wrap: wrap; }
    .actions button { border: 1px solid var(--border); background: transparent; color: var(--text); border-radius: 8px; padding: .35rem .6rem; cursor: pointer; font-size: .8rem; }
    .actions button.danger { border-color: var(--danger); color: var(--danger); }
    .text-muted { color: var(--muted); }
  `],
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
