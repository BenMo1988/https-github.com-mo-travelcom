const { test, expect } = require('@playwright/test');
const { openPage } = require('./helpers');

test('main menu has Shop with trip and product links, plus About and Help', async ({ page }) => {
  await openPage(page, '/');
  const nav = page.locator('.header__inline-menu');
  for (const href of [
    '/collections/carry-on-only', '/collections/family-road-trips', '/collections/weekend-getaways',
    '/collections/suitcases', '/collections/bags-backpacks', '/collections/organisers', '/collections/comfort-kits',
    '/pages/about', '/pages/help',
  ]) {
    await expect(nav.locator(`a[href="${href}"]`).first()).toBeAttached();
  }
  await expect(nav.locator('summary', { hasText: 'Shop' })).toHaveCount(1);
});
