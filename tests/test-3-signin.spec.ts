import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.locator('body').click();
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'Log in' }).click();
  await page.locator('input[name="txtUser"]').click();
  await page.locator('input[name="txtUser"]').fill('_testUser3');
  await page.locator('input[name="txtPwd"]').click();
  await page.locator('input[name="txtPwd"]').fill('123456');
  await page.getByRole('button', { name: 'Log In' }).click();
  const isLoggedIn = await page.locator('div').filter({ hasText: /^_testUser3$/ }).count() > 0;
  if (!isLoggedIn) {
    await page.goto('http://localhost:3000/');
    await page.getByRole('link', { name: 'Sign Up' }).click();
    await page.locator('input[name="username"]').click();
    await page.locator('input[name="username"]').fill('_testUser3');
    await page.locator('input[name="email"]').click();
    await page.locator('input[name="email"]').fill('testUser1@gmail.com');
    await page.locator('input[name="password"]').click();
    await page.locator('input[name="password"]').fill('123456');
    await page.locator('input[name="confirm_password"]').click();
    await page.locator('input[name="confirm_password"]').fill('123456');
    await page.getByRole('button', { name: 'Sign Up' }).click();
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    await page.getByRole('button', { name: 'Delete Account' }).click();
    // pressing ok in the alert
    await expect(page.locator('body')).toContainText('Log in');
  }
  else {
    await page.getByRole('button', { name: 'Account' }).click();
    await page.getByRole('button', { name: 'Account' }).click({
      button: 'right'
    });
    await expect(page.getByRole('button', { name: 'Account' })).toBeVisible();
    await page.getByRole('button', { name: 'Account' }).click();
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    await page.getByRole('button', { name: 'Delete Account' }).click();
    // pressing ok in the alert
    await expect(page.locator('body')).toContainText('Log in');
  }
});