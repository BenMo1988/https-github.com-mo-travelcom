const { test, expect } = require('@playwright/test');
const { openPage } = require('./helpers');

test('footer is deep blue with brand text and Shop / Help columns', async ({ page }) => {
  await openPage(page, '/');
  const footer = page.locator('footer.footer');
  expect(await footer.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(29, 59, 83)');
  await expect(footer).toContainText('We make travel lighter, so you can arrive ready.');
  await expect(footer.locator('.footer-block__heading', { hasText: 'Shop' })).toHaveCount(1);
  await expect(footer.locator('.footer-block__heading', { hasText: 'Help' })).toHaveCount(1);
  await expect(footer.locator('.footer__follow-on-shop')).toHaveCount(0);
});

test('every footer link resolves', async ({ page, request }) => {
  await openPage(page, '/');
  const hrefs = await page.locator('footer.footer a[href^="/"]').evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute('href')))]);
  expect(hrefs.length).toBeGreaterThanOrEqual(8);
  for (const href of hrefs) {
    const res = await request.get(href);
    expect(res.status(), href).toBe(200);
  }
});
