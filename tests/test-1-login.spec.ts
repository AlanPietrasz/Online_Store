import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('about:blank');
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'Home Page' }).click();
  await page.getByRole('link', { name: 'Shop' }).click();
  await page.getByRole('link', { name: 'Leaderboard' }).click();
  await page.getByRole('link', { name: 'Home Page' }).click();
  await page.getByRole('link', { name: 'Log in' }).click();
  await page.locator('input[name="txtUser"]').click();
  await page.locator('input[name="txtUser"]').click();
  await page.locator('input[name="txtUser"]').click();
  await page.locator('input[name="txtUser"]').click();
  await page.locator('input[name="txtUser"]').fill('superuser');
  await page.locator('input[name="txtPwd"]').click();
  await page.locator('input[name="txtPwd"]').fill('superuser');
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.locator('div').filter({ hasText: /^superuser$/ }).click();
});
