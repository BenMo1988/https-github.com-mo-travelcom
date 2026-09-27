async function openPage(page, path) {
  await page.goto(path);
  await page.evaluate(() => document.querySelector('#shopify-pc__banner')?.remove());
}

async function fg(locator) {
  const value = await locator.evaluate((el) => getComputedStyle(el).getPropertyValue('--color-foreground'));
  return value.replace(/\s/g, '');
}

module.exports = { openPage, fg };
