const { test, expect } = require('@playwright/test');
const { openPage, fg } = require('./helpers');

const LIGHT = '250,248,244';
const DARK = '43,43,43';

test('homepage header is transparent with light text at the top', async ({ page }) => {
  await openPage(page, '/');
  const wrapper = page.locator('.header-wrapper');
  await expect(wrapper).toHaveClass(/bp-header--transparent/);
  expect(await fg(wrapper)).toBe(LIGHT);
  const bgColor = await wrapper.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bgColor).toBe('rgba(0, 0, 0, 0)');
});

test('transparent header gradient does not repeat into the bottom border (no dark line)', async ({ page }) => {
  await openPage(page, '/');
  const style = await page.locator('.header-wrapper').evaluate((el) => {
    const cs = getComputedStyle(el);
    return { repeat: cs.backgroundRepeat, origin: cs.backgroundOrigin };
  });
  expect(style.repeat === 'no-repeat' || style.origin === 'border-box').toBe(true);
});

test('hero starts under the transparent header', async ({ page }) => {
  await openPage(page, '/');
  const headerTop = await page.locator('.section-header').evaluate((el) => el.getBoundingClientRect().top);
  const heroTop = await page.locator('main .shopify-section').first().evaluate((el) => el.getBoundingClientRect().top);
  expect(Math.abs(heroTop - headerTop)).toBeLessThanOrEqual(1);
});

test('header turns solid when revealed after scrolling back up', async ({ page }) => {
  await openPage(page, '/');
  await page.mouse.wheel(0, 1500);
  await page.waitForTimeout(400);
  await page.mouse.wheel(0, -300);
  await expect(page.locator('.section-header')).toHaveClass(/shopify-section-header-sticky/);
  await expect.poll(() => fg(page.locator('.header-wrapper'))).toBe(DARK);
});

test('other pages keep the solid header', async ({ page }) => {
  await openPage(page, '/collections/all');
  const wrapper = page.locator('.header-wrapper');
  await expect(wrapper).not.toHaveClass(/bp-header--transparent/);
  expect(await fg(wrapper)).toBe(DARK);
});

test('mobile: opening the menu drawer over the transparent header makes it solid', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPage(page, '/');
  const wrapper = page.locator('.header-wrapper');
  expect(await fg(wrapper)).toBe(LIGHT);
  await page.locator('header-drawer summary').first().click();
  await expect.poll(() => fg(wrapper)).toBe(DARK);
});
