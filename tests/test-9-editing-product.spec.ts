import { test, expect } from '@playwright/test';

test.skip('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'Log in' }).click();
  await page.locator('input[name="txtUser"]').click();
  await page.locator('input[name="txtUser"]').fill('superuser');
  await page.locator('input[name="txtPwd"]').click();
  await page.locator('input[name="txtPwd"]').fill('superuser');
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.getByRole('link', { name: 'Shop' }).click();

  await page.getByPlaceholder('Search products...').click();
  await page.getByPlaceholder('Search products...').fill('9');
  await page.getByRole('button', { name: 'Search and Sort Products' }).click();
  await expect(page.locator('h2')).toContainText('P9_edited_2');
  await page.getByText('Description 2').click();
  await expect(page.locator('#product_17')).toContainText('Description 2 3');
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Description', { exact: true }).click();
  await page.getByLabel('Description', { exact: true }).fill('Description 2 3 4');
  await page.getByLabel('Description', { exact: true }).click();
  await page.getByRole('button', { name: 'Submit Changes' }).click();
  //await page.getByText('Description 2 3').click();
  await expect(page.locator('#product_17')).toContainText('Description 2 3 4');
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Description', { exact: true }).click();
  await page.getByLabel('Description', { exact: true }).fill('Description 2 3');
  await page.getByRole('button', { name: 'Submit Changes' }).click();
  await expect(page.locator('#product_17')).toContainText('Description 2 3');

});