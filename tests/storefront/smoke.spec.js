const { test, expect } = require('@playwright/test');
const { openPage } = require('./helpers');

test('preview serves the homepage with a header', async ({ page }) => {
  await openPage(page, '/');
  await expect(page.locator('.header-wrapper')).toBeVisible();
  await expect(page.locator('.section-header')).toHaveCount(1);
});
