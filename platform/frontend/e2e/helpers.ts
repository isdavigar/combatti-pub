import { Page } from '@playwright/test';

export interface MockUser {
  id: number;
  username: string;
  displayName: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
}

export const adminUser: MockUser = {
  id: 1,
  username: 'admin',
  displayName: 'Administrador General',
  tenantId: 'default',
  roles: ['Administrador'],
  permissions: [
    'pos.tables',
    'pos.orders',
    'pos.kitchen',
    'pos.cash',
    'catalog.read',
    'catalog.write',
    'reports.read',
    'users.manage',
    'settings.manage',
    'integrations.manage',
  ],
};

/** Mockea el endpoint de login para devolver el usuario indicado. */
export async function mockLogin(page: Page, user: MockUser): Promise<void> {
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'fake-jwt-token',
        tokenType: 'Bearer',
        expiresIn: 86400,
        user,
      }),
    });
  });
}

/** Realiza el flujo de login por la UI con el usuario indicado. */
export async function login(page: Page, user: MockUser = adminUser): Promise<void> {
  await mockLogin(page, user);
  await page.goto('/login');
  await page.getByLabel('Usuario').fill(user.username);
  await page.getByLabel('Contraseña').fill('cualquier-clave');
  await page.getByRole('button', { name: 'Ingresar' }).click();
}
