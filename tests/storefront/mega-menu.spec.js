const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { openPage, fg } = require('./helpers');

const TRIPS = ['/collections/carry-on-only', '/collections/family-road-trips', '/collections/weekend-getaways'];

async function openShop(page) {
  await page.locator('.header__inline-menu summary', { hasText: 'Shop' }).click();
  await expect(page.locator('.bp-mega')).toBeVisible();
}

test('Shop opens a panel with text columns and three trip tiles', async ({ page }) => {
  await openPage(page, '/collections/all');
  await openShop(page);
  await expect(page.locator('.bp-mega__columns')).toContainText('By trip');
  await expect(page.locator('.bp-mega__columns')).toContainText('By product');
  const tiles = page.locator('a.bp-mega__tile');
  await expect(tiles).toHaveCount(3);
  for (let i = 0; i < TRIPS.length; i++) {
    await expect(tiles.nth(i)).toHaveAttribute('href', TRIPS[i]);
  }
  await expect(page.locator('.bp-mega a', { hasText: 'Shop all products' })).toHaveAttribute('href', '/collections/all');
});

test('a tile without a collection image shows the sand placeholder, not a broken image', async ({ page }) => {
  await openPage(page, '/collections/all');
  await openShop(page);
  const tile = page.locator('a.bp-mega__tile').first();
  const hasImage = await tile.locator('img.bp-mega__tile-image').count();
  if (hasImage) {
    const loaded = await tile.locator('img').evaluate((img) => img.complete && img.naturalWidth > 0);
    expect(loaded).toBe(true);
  } else {
    const placeholder = tile.locator('.bp-mega__tile-placeholder');
    await expect(placeholder).toBeVisible();
    expect(await placeholder.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(232, 220, 200)');
  }
  await expect(tile.locator('.bp-mega__tile-caption')).toContainText('Carry-on only');
});

test('opening the menu over the transparent homepage header makes it solid', async ({ page }) => {
  await openPage(page, '/');
  expect(await fg(page.locator('.header-wrapper'))).toBe('250,248,244');
  await openShop(page);
  await expect.poll(() => fg(page.locator('.header-wrapper'))).toBe('43,43,43');
});

test('keyboard: Enter opens, Tab reaches a tile, Escape closes', async ({ page }) => {
  await openPage(page, '/collections/all');
  const summary = page.locator('.header__inline-menu summary', { hasText: 'Shop' });
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.bp-mega')).toBeVisible();
  let reachedTile = false;
  for (let i = 0; i < 20 && !reachedTile; i++) {
    await page.keyboard.press('Tab');
    reachedTile = await page.evaluate(() => document.activeElement?.classList.contains('bp-mega__tile'));
  }
  expect(reachedTile).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('.bp-mega')).toBeHidden();
});

test('mobile drawer lists the trip links as text, without tiles', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPage(page, '/collections/all');
  await page.locator('header-drawer summary').first().click();
  for (const href of TRIPS) {
    await expect(page.locator(`#menu-drawer a[href="${href}"]`).first()).toBeAttached();
  }
  await expect(page.locator('#menu-drawer .bp-mega__tile')).toHaveCount(0);
});

test("a tiles column name that does not exist falls back to Dawn's default mega menu", async ({ page }) => {
  const file = path.join(__dirname, '../../shopify/theme/sections/header-group.json');
  const original = fs.readFileSync(file, 'utf8');
  try {
    fs.writeFileSync(file, original.replace('"bp_mega_tiles_column": "By trip"', '"bp_mega_tiles_column": "No such column"'));
    await page.waitForTimeout(6000); // let shopify theme dev sync the change
    await openPage(page, '/collections/all');
    await page.locator('.header__inline-menu summary', { hasText: 'Shop' }).click();
    await expect(page.locator('.mega-menu__list')).toBeVisible();
    await expect(page.locator('.bp-mega')).toHaveCount(0);
  } finally {
    fs.writeFileSync(file, original);
    await page.waitForTimeout(6000);
  }
});
