import { expect, test } from '@playwright/test';

import { adminUser, login } from './helpers';

test.describe('Dashboard', () => {
  test('muestra los módulos del POS y los datos de sesión', async ({ page }) => {
    await login(page);

    await expect(page.getByRole('link', { name: /Mesas/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Nuevo pedido/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Cocina/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Cobrar/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Reportes/ })).toBeVisible();

    // Como administrador, ve los módulos privilegiados.
    await expect(page.getByRole('link', { name: /Usuarios/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Configuración/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Integraciones/ })).toBeVisible();

    // Los permisos efectivos se muestran como chips.
    await expect(page.getByText('integrations.manage')).toBeVisible();
  });

  test('un usuario sin permisos privilegiados no ve esos módulos', async ({ page }) => {
    await login(page, {
      ...adminUser,
      displayName: 'Mesero Juan',
      roles: ['Mesero'],
      permissions: ['pos.tables', 'pos.orders'],
    });

    await expect(page.getByRole('heading', { name: /Bienvenido, Mesero Juan/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Mesas/ })).toBeVisible();

    await expect(page.getByRole('link', { name: /Usuarios/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Configuración/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Integraciones/ })).toHaveCount(0);
  });
});
