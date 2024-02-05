import { test, expect } from '@playwright/test';

test('test1', async ({ page }) => {
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
  await page.locator('input[name="txtUser"]').fill('_testUser1');
  await page.locator('input[name="txtPwd"]').click();
  await page.locator('input[name="txtPwd"]').fill('123456');
  await page.locator('input[name="txtPwd"]').press('Enter');
  await page.getByText('_testUser1').click();
  await expect(page.locator('body')).toContainText('_testUser1');
});

test('test2', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'Log in' }).click();
  await page.locator('input[name="txtUser"]').click();
  await page.locator('input[name="txtUser"]').fill('_testUser1');
  await page.locator('input[name="txtPwd"]').click();
  await page.locator('input[name="txtPwd"]').fill('123456');
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.getByText('_testUser1').click();
  await expect(page.locator('body')).toContainText('_testUser1');
  await page.getByRole('button', { name: 'Account' }).click();
  await page.getByRole('link', { name: 'My Account' }).click();
  await page.getByText('Email: testuser1@gmail.com').click();
});