const { test, expect } = require('@playwright/test');
const { openPage } = require('./helpers');

test('announcement bar shows three brand messages on deep blue', async ({ page }) => {
  await openPage(page, '/');
  const bar = page.locator('.utility-bar');
  const messages = bar.locator('.announcement-bar__message');
  await expect(messages).toHaveCount(3);
  await expect(messages.nth(0)).toContainText('Tracked shipping across Europe');
  await expect(messages.nth(1)).toContainText('14-day returns');
  await expect(messages.nth(2)).toContainText('2-year warranty');
  const bg = await bar.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).toBe('rgb(29, 59, 83)');
});
