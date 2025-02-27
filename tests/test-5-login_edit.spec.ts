import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'Log in' }).click();
  await page.locator('input[name="txtUser"]').click();
  await page.locator('input[name="txtUser"]').fill('_testUser4');
  await page.locator('input[name="txtPwd"]').click();
  await page.locator('input[name="txtPwd"]').fill('123456');
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.getByRole('button', { name: 'Account' }).click();
  await page.getByRole('link', { name: 'My Account' }).click();
  await page.getByRole('button', { name: 'Edit Account' }).click();
  await page.getByLabel('Email:').click();
  await page.getByLabel('Email:').fill('test@gmail.com');
  await page.getByLabel('Email:').click();
  await page.getByLabel('Email:').press('ArrowLeft');
  await page.getByLabel('Email:').press('ArrowLeft');
  await page.getByLabel('Email:').press('ArrowLeft');
  await page.getByLabel('Email:').press('ArrowLeft');
  await page.getByLabel('Email:').press('ArrowLeft');
  await page.getByLabel('Email:').press('ArrowLeft');
  await page.getByLabel('Email:').press('ArrowLeft');
  await page.getByLabel('Email:').press('ArrowLeft');
  await page.getByLabel('Email:').press('ArrowLeft');
  await page.getByLabel('Email:').press('ArrowLeft');
  await page.getByLabel('Email:').press('ArrowLeft');
  await page.getByLabel('Email:').press('ArrowRight');
  await page.getByLabel('Email:').press('ArrowRight');
  await page.getByLabel('Email:').fill('testuser42@gmail.com');
  await page.getByRole('button', { name: 'Update Account' }).click();
  await page.getByText('Email: testuser42@gmail.com').click();
  await expect(page.locator('body')).toContainText('Email: testuser42@gmail.com');
  await page.getByRole('button', { name: 'Edit Account' }).click();
  await page.getByLabel('Email:').click();
  await page.getByLabel('Email:').fill('testuser4@gmail.com');
  await page.getByRole('button', { name: 'Update Account' }).click();
  await page.getByText('Email: testuser4@gmail.com').click();
  await expect(page.locator('body')).toContainText('Email: testuser4@gmail.com');
});