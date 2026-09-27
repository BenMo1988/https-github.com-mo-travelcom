const { test, expect } = require('@playwright/test');
const { openPage } = require('./helpers');

for (const path of ['/pages/about', '/pages/help', '/policies/shipping-policy', '/policies/refund-policy']) {
  test(`${path} exists`, async ({ request }) => {
    const res = await request.get(path);
    expect(res.status()).toBe(200);
  });
}

test('help page shows the FAQ as collapsible rows', async ({ page }) => {
  await openPage(page, '/pages/help');
  const rows = page.locator('.collapsible-content details');
  await expect(rows).toHaveCount(7);
  await expect(rows.first().locator('summary')).toContainText('How do I place an order?');
});
