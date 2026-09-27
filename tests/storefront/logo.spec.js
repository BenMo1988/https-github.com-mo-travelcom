const { test, expect } = require('@playwright/test');
const { openPage } = require('./helpers');

const BLUE = 'rgb(29, 59, 83)';
const OFF_WHITE = 'rgb(250, 248, 244)';

const logoColors = (page) =>
  page.locator('.header__heading-link .bp-logo').evaluate((el) => ({
    tag: getComputedStyle(el.querySelector('.bp-logo__tag')).fill,
    sun: getComputedStyle(el.querySelector('.bp-logo__sun')).fill,
    word: getComputedStyle(el.querySelector('.bp-logo__word')).color,
  }));

test('header shows the label mark with the Basepacker wordmark, linking home', async ({ page }) => {
  await openPage(page, '/collections/all');
  const link = page.locator('.header__heading-link');
  await expect(link).toHaveAttribute('href', '/');
  await expect(link.locator('.bp-logo svg')).toBeVisible();
  await expect(link.locator('.bp-logo__word')).toHaveText('Basepacker');
});

test('logo is blue with a terracotta sun on a solid header', async ({ page }) => {
  await openPage(page, '/collections/all');
  expect(await logoColors(page)).toEqual({ tag: BLUE, sun: 'rgb(201, 123, 74)', word: BLUE });
});

test('logo is reversed to off-white over the homepage hero', async ({ page }) => {
  await openPage(page, '/');
  const colors = await logoColors(page);
  expect(colors.tag).toBe(OFF_WHITE);
  expect(colors.word).toBe(OFF_WHITE);
});

test('logo turns blue again when the sticky header is revealed on the homepage', async ({ page }) => {
  await openPage(page, '/');
  await page.mouse.wheel(0, 1500);
  await page.waitForTimeout(400);
  await page.mouse.wheel(0, -300);
  await expect(page.locator('.section-header')).toHaveClass(/shopify-section-header-sticky/);
  await expect.poll(async () => (await logoColors(page)).tag).toBe(BLUE);
});

test('mobile: logo fits in the header next to the menu and cart icons', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPage(page, '/collections/all');
  const logo = page.locator('.header__heading-link .bp-logo');
  await expect(logo).toBeVisible();
  const box = await logo.boundingBox();
  expect(box.width).toBeLessThanOrEqual(200);
  expect(box.height).toBeGreaterThanOrEqual(24);
});

test('favicon uses the Basepacker label, with a PNG fallback', async ({ page }) => {
  await openPage(page, '/');
  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute('href', /bp-favicon.*\.svg/);
  await expect(page.locator('link[rel="icon"][type="image/png"]')).toHaveAttribute('href', /bp-favicon.*\.png/);
});
