import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <!-- App Topbar (green bar) -->
    <header class="app-topbar">
      <div class="app-topbar-left">
        <button class="app-topbar-icon-btn sidebar-toggle-mobile" (click)="toggleSidebar()">
          <i class="fa-solid fa-bars"></i>
        </button>
        <div class="app-topbar-brand">
          <div class="app-topbar-logo">
            <span class="brand-logo-text">C</span>
          </div>
          <span class="app-topbar-brand-name">Combatti POS</span>
        </div>
      </div>

      <div class="app-topbar-right">
        <div class="cloud-indicator cloud-live">
          <span class="cloud-dot"></span>
          <span class="cloud-indicator-text">En línea</span>
        </div>

        <div class="user-menu" [class.open]="userMenuOpen()">
          <button class="user-menu-trigger" (click)="toggleUserMenu()">
            <span class="user-avatar">
              {{ userInitial() }}
            </span>
            <span class="user-menu-id">
              <span class="fw-bold">{{ user()?.displayName }}</span>
            </span>
            <i class="fa-solid fa-chevron-down user-menu-caret"></i>
          </button>
          @if (userMenuOpen()) {
            <div class="user-menu-dropdown">
              <button class="user-menu-item" (click)="toggleDarkMode()">
                <i class="fa-solid fa-moon"></i> Modo oscuro
              </button>
              <button class="user-menu-item danger" (click)="logout()">
                <i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión
              </button>
            </div>
          }
        </div>
      </div>
    </header>

    <!-- Sidebar backdrop (mobile) -->
    <div
      class="sidebar-backdrop"
      [class.show]="sidebarOpen()"
      (click)="closeSidebar()"
    ></div>

    <!-- Sidebar / Nav -->
    <nav class="sidebar" [class.open]="sidebarOpen()">
      <div class="brand-badge">
        <div class="brand-logo"><span class="brand-logo-text">C</span></div>
        <div>
          <p class="brand-title">Combatti</p>
          <p class="brand-sub">POS Restaurante</p>
        </div>
      </div>

      <div class="nav-list">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-pill" (click)="closeSidebar()">
          <i class="fa-solid fa-chart-pie"></i> Dashboard
        </a>
        <a routerLink="/tables" routerLinkActive="active" class="nav-pill" (click)="closeSidebar()">
          <i class="fa-solid fa-chair"></i> Mesas
        </a>
        <a routerLink="/orders/new" routerLinkActive="active" class="nav-pill" (click)="closeSidebar()">
          <i class="fa-solid fa-receipt"></i> Nuevo pedido
        </a>
        <a routerLink="/kitchen" routerLinkActive="active" class="nav-pill" (click)="closeSidebar()">
          <i class="fa-solid fa-fire-burner"></i> Cocina
        </a>
        <a routerLink="/checkout" routerLinkActive="active" class="nav-pill" (click)="closeSidebar()">
          <i class="fa-solid fa-money-bill-wave"></i> Cobrar
        </a>
        <a routerLink="/cash" routerLinkActive="active" class="nav-pill" (click)="closeSidebar()">
          <i class="fa-solid fa-cash-register"></i> Caja
        </a>
        <a routerLink="/reports" routerLinkActive="active" class="nav-pill" (click)="closeSidebar()">
          <i class="fa-solid fa-chart-column"></i> Reportes
        </a>
        <a routerLink="/menu" routerLinkActive="active" class="nav-pill" (click)="closeSidebar()">
          <i class="fa-solid fa-utensils"></i> Menú
        </a>
        @if (canManageUsers()) {
          <a routerLink="/users" routerLinkActive="active" class="nav-pill" (click)="closeSidebar()">
            <i class="fa-solid fa-users"></i> Usuarios
          </a>
        }
        @if (canManageSettings()) {
          <a routerLink="/settings" routerLinkActive="active" class="nav-pill" (click)="closeSidebar()">
            <i class="fa-solid fa-gear"></i> Configuración
          </a>
        }
        @if (canManageIntegrations()) {
          <a routerLink="/integrations" routerLinkActive="active" class="nav-pill" (click)="closeSidebar()">
            <i class="fa-solid fa-plug"></i> Integraciones
          </a>
        }
      </div>
    </nav>

    <!-- Main content -->
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }

    .sidebar-toggle-mobile { display: none; }

    .sidebar-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.48); z-index: 900; display: none; }
    .sidebar-backdrop.show { display: block; }

    .nav-list { display: contents; }

    @media (max-width: 992px) {
      .sidebar-toggle-mobile { display: grid; }
      .sidebar { transform: translateX(-100%); }
      .sidebar.open { transform: translateX(0); }
    }

    @media (min-width: 993px) {
      .sidebar .nav-list {
        display: flex; flex-direction: row; flex-wrap: wrap;
        gap: 6px; flex: 1 1 auto; align-items: center;
      }
    }
  `],
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.auth.user;
  readonly sidebarOpen = signal(false);
  readonly userMenuOpen = signal(false);

  readonly userInitial = () => {
    const name = this.user()?.displayName;
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  canManageUsers(): boolean { return this.auth.hasPermission('users.manage'); }
  canManageSettings(): boolean { return this.auth.hasPermission('settings.manage'); }
  canManageIntegrations(): boolean { return this.auth.hasPermission('integrations.manage'); }

  toggleSidebar(): void { this.sidebarOpen.update(v => !v); }
  closeSidebar(): void { this.sidebarOpen.set(false); }
  toggleUserMenu(): void { this.userMenuOpen.update(v => !v); }

  toggleDarkMode(): void {
    document.body.classList.toggle('dark-mode');
    this.userMenuOpen.set(false);
  }

  logout(): void {
    this.userMenuOpen.set(false);
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
