const { test, expect } = require('@playwright/test');
const { openPage } = require('./helpers');

async function loadedImages(locator) {
  await locator.first().scrollIntoViewIfNeeded();
  return locator.evaluateAll(async (imgs) => {
    await Promise.all(imgs.map((img) => (img.complete ? null : new Promise((r) => { img.onload = r; img.onerror = r; }))));
    return imgs.map((img) => ({ src: img.currentSrc || img.src, ok: img.naturalWidth > 0 }));
  });
}

test('homepage hero uses the brand photo', async ({ page }) => {
  await openPage(page, '/');
  const imgs = await loadedImages(page.locator('main .shopify-section').first().locator('.banner__media img'));
  expect(imgs.length).toBeGreaterThan(0);
  expect(imgs[0].src).toContain('hero-home');
  expect(imgs[0].ok).toBe(true);
});

test('shop by trip columns show the three trip photos', async ({ page }) => {
  await openPage(page, '/');
  const imgs = await loadedImages(page.locator('.multicolumn', { hasText: 'Shop by trip' }).locator('img'));
  expect(imgs.map((i) => i.src).join(' ')).toMatch(/carry-on-only.*family-road-trips.*weekend-getaways/);
  expect(imgs.every((i) => i.ok)).toBe(true);
});

test('homepage problem/solution blocks use packing and flight photos', async ({ page }) => {
  await openPage(page, '/');
  const imgs = await loadedImages(page.locator('.image-with-text img'));
  const srcs = imgs.map((i) => i.src).join(' ');
  expect(srcs).toContain('packing-cubes');
  expect(srcs).toContain('flight-comfort');
  expect(imgs.every((i) => i.ok)).toBe(true);
});

test('product page problem/solution uses the organised backpack photo', async ({ page }) => {
  await openPage(page, '/products/the-carry-on-companion');
  const imgs = await loadedImages(page.locator('.image-with-text img'));
  expect(imgs.map((i) => i.src).join(' ')).toContain('backpack-organised');
});

test('about page opens with the banner photo', async ({ page }) => {
  await openPage(page, '/pages/about');
  const imgs = await loadedImages(page.locator('.banner__media img'));
  expect(imgs.length).toBeGreaterThan(0);
  expect(imgs[0].src).toContain('about-banner');
});

for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`hero headline sits below the transparent header at ${vp.width}px`, async ({ page }) => {
    await page.setViewportSize(vp);
    await openPage(page, '/');
    const headerBottom = await page.locator('.section-header').evaluate((el) => el.getBoundingClientRect().bottom);
    const headingTop = await page.locator('main .shopify-section').first().locator('.banner__heading').evaluate((el) => el.getBoundingClientRect().top);
    expect(headingTop).toBeGreaterThanOrEqual(headerBottom + 16);
  });
}
