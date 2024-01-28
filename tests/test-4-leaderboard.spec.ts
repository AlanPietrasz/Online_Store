import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/leaderboard');
  await page.getByRole('heading', { name: 'Top 10 Users' }).click();
  await expect(page.locator('h2')).toContainText('Top 10 Users');
});