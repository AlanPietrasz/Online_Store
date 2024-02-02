import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'Log in' }).click();
  await page.locator('input[name="txtUser"]').click();
  await page.locator('input[name="txtUser"]').fill('_testUser1');
  await page.locator('input[name="txtPwd"]').click();
  await page.locator('input[name="txtPwd"]').fill('123456');
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.getByText('_testUser1').nth(1).click();
  await page.getByRole('button', { name: 'Account' }).click();
  await page.getByRole('link', { name: 'My Account' }).click();
  await page.getByText('Email: testuser1@gmail.com').click();
});