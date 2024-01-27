import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'Log in' }).click();
  await page.locator('input[name="txtUser"]').click();
  await page.locator('input[name="txtUser"]').fill('superuser');
  await page.locator('input[name="txtPwd"]').click();
  await page.locator('input[name="txtPwd"]').fill('superuser1');
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.locator('input[name="txtUser"]').click();
  await page.locator('input[name="txtUser"]').fill('');
  await page.locator('input[name="txtUser"]').click();
  await page.locator('input[name="txtUser"]').fill('superuser');
  await page.getByText('Wrong username or password').click();
  await page.locator('input[name="txtPwd"]').click();
  await page.locator('input[name="txtPwd"]').fill('superuser');
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.getByRole('button', { name: 'Account' }).click();
  await page.getByRole('button', { name: 'Account' }).click({
    button: 'right'
  });
  await expect(page.getByRole('button', { name: 'Account' })).toBeVisible();
  await page.getByRole('button', { name: 'Account' }).click();
  await page.getByRole('link', { name: 'Log Out' }).click();
  await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
});