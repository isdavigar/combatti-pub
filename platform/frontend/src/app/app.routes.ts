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
      import('./shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'menu',
        loadComponent: () =>
          import('./features/menu/menu.component').then((m) => m.MenuComponent),
      },
      {
        path: 'tables',
        loadComponent: () =>
          import('./features/tables/tables.component').then((m) => m.TablesComponent),
      },
      {
        path: 'kitchen',
        loadComponent: () =>
          import('./features/kitchen/kitchen.component').then((m) => m.KitchenComponent),
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('./features/checkout/checkout.component').then((m) => m.CheckoutComponent),
      },
      {
        path: 'cash',
        loadComponent: () =>
          import('./features/cash/cash.component').then((m) => m.CashComponent),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports.component').then((m) => m.ReportsComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: 'integrations',
        loadComponent: () =>
          import('./features/integrations/integrations.component').then((m) => m.IntegrationsComponent),
      },
      {
        path: 'orders/new',
        loadComponent: () =>
          import('./features/order-new/order-new.component').then((m) => m.OrderNewComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
