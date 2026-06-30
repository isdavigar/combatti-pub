import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'menu',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/menu/menu.component').then((m) => m.MenuComponent),
  },
  {
    path: 'tables',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tables/tables.component').then((m) => m.TablesComponent),
  },
  {
    path: 'kitchen',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/kitchen/kitchen.component').then((m) => m.KitchenComponent),
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/checkout/checkout.component').then((m) => m.CheckoutComponent),
  },
  {
    path: 'cash',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cash/cash.component').then((m) => m.CashComponent),
  },
  {
    path: 'reports',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/reports/reports.component').then((m) => m.ReportsComponent),
  },
  {
    path: 'users',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/users/users.component').then((m) => m.UsersComponent),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/settings/settings.component').then((m) => m.SettingsComponent),
  },
  {
    path: 'integrations',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/integrations/integrations.component').then((m) => m.IntegrationsComponent),
  },
  {
    path: 'orders/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/order-new/order-new.component').then((m) => m.OrderNewComponent),
  },
  { path: '**', redirectTo: '' },
];
