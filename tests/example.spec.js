const { test, expect } = require('@playwright/test');

test('homepage heeft de juiste titel', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await expect(page).toHaveTitle(/Playwright/);
});
