// Storefront tests run against the local Shopify preview (shopify theme dev).
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/storefront',
  timeout: 30000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:9292',
    viewport: { width: 1440, height: 900 },
  },
});
