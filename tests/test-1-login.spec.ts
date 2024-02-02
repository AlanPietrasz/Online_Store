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
  await page.locator('input[name="txtUser"]').fill('_testUser1');
  await page.locator('input[name="txtPwd"]').click();
  await page.locator('input[name="txtPwd"]').fill('123456');
  await page.locator('input[name="txtPwd"]').press('Enter');
  await page.getByText('_testUser1').nth(1).click({
    button: 'right'
  });
  await page.getByText('_testUser1').nth(1).click();
  await expect(page.locator('body')).toContainText('_testUser1');
});
