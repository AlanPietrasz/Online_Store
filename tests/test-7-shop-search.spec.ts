import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'Log in' }).click();
  await page.locator('input[name="txtUser"]').click();
  await page.locator('input[name="txtUser"]').fill('_testUser7');
  await page.locator('input[name="txtPwd"]').click();
  await page.locator('input[name="txtPwd"]').fill('123456');
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.getByRole('link', { name: 'Shop' }).click();
  await page.getByPlaceholder('Search products...').click();
  await page.getByPlaceholder('Search products...').fill('Product4 abc');
  await page.locator('select[name="direction"]').selectOption('DESC');
  await page.locator('select[name="pageSize"]').selectOption('2');
  await page.getByRole('button', { name: 'Search and Sort Products' }).click();
  await expect(page.getByPlaceholder('Search products...')).toHaveValue('Product4 abc');
  // await expect(page.locator('select[name="orderBy"]')).toHaveValue('price');
  await expect(page.locator('select[name="direction"]')).toHaveValue('DESC');
  await expect(page.locator('select[name="pageSize"]')).toHaveValue('2');
  await expect(page.locator('h2')).toContainText('Product4 abc');
  await page.locator('#quantity_4').click();
  await page.locator('#quantity_4').fill('5');
  await page.locator('#quantity_4').press('Enter');
});