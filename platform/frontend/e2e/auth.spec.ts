import { expect, test } from '@playwright/test';

import { login } from './helpers';

test.describe('Autenticación', () => {
  test('login exitoso lleva al dashboard', async ({ page }) => {
    await login(page);

    await expect(page).toHaveURL(/localhost:4200\/$/);
    await expect(
      page.getByRole('heading', { name: /Bienvenido, Administrador General/ }),
    ).toBeVisible();
  });

  test('credenciales inválidas muestran un error', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Credenciales inválidas' }),
      }),
    );

    await page.goto('/login');
    await page.getByLabel('Usuario').fill('admin');
    await page.getByLabel('Contraseña').fill('clave-incorrecta');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page.getByText('Credenciales inválidas')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('una ruta protegida sin sesión redirige al login', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible();
  });

  test('cerrar sesión vuelve al login', async ({ page }) => {
    await login(page);
    await expect(page.getByRole('heading', { name: /Bienvenido/ })).toBeVisible();

    await page.getByRole('button', { name: 'Salir' }).click();

    await expect(page).toHaveURL(/\/login$/);
  });
});
