# Header & Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Basepacker store a branded announcement bar, a transparent-on-homepage header with an image-tile mega menu, a deep-blue footer, and the About / Help pages and shipping / refund policies the navigation links to.

**Architecture:** Extend Dawn rather than replace it. Theme work is one CSS-only transparent-header layer (driven by Dawn's existing `shopify-section-header-sticky` class and `--header-height` variable plus `:has(details[open])`), one rewritten mega-menu snippet with a tiles branch, and settings-only changes in the header/footer section groups. Store content (collections, menus, pages, policies) is created in Shopify Admin through the merchant's logged-in Chrome.

**Tech Stack:** Shopify Dawn theme (Liquid, CSS), Shopify CLI 4.8.2 (`shopify theme dev` on http://127.0.0.1:9292), Playwright Test 1.63 for storefront tests, Claude in Chrome for Admin.

**Spec:** `docs/superpowers/specs/2026-09-27-header-footer-design.md`

## Global Constraints

- Store: `qjhjk2-w3.myshopify.com`; live theme `Dawn` #193596588298. Theme files live in `shopify/theme/`.
- Brand colours: deep blue `#1D3B53`, sand `#E8DCC8`, off-white `#FAF8F4`, anthracite `#2B2B2B`. Colour scheme 1 = off-white, scheme 3 = deep blue (already configured in `config/settings_data.json`; do not edit that file in this plan).
- Fonts: headings Fraunces, body Inter (already configured).
- All storefront copy is English, calm and concrete, no superlatives or exclamation marks (brand strategy §1.3).
- Unknown facts are written as the literal marker `[fill in]` so the merchant can search for them. This marker is intentional content, not a plan placeholder.
- Admin changes happen only through the merchant's Chrome, only after the merchant approves that task's Admin batch in chat. Never delete anything in Admin.
- Never push to the live theme without the merchant's explicit "go live" in chat. Before any live push, pull the live copy of each file being pushed and confirm its content equals the last commit; push only the named files with `--only`; re-pull afterwards and confirm live equals local.
- Keep `shopify theme dev` running for tests (Task 1 explains how to start it).

## Review Focus

1. **Mega menu or mobile drawer opened while the header is still transparent** — the header must turn solid off-white with dark text so the panel is readable, and must not jump or leave a gap. Tested in Task 6 (drawer) and Task 7 (mega menu).
2. **Scrolling back up on the homepage** — the revealed sticky header must be solid, not white text on page content. Tested in Task 6.
3. **A "By trip" link with no collection image, or a link that is not a collection** — the tile must show the sand placeholder with the title, never a broken image. Tested in Task 7.
4. **A tiles column name that doesn't exist in the menu** — Dawn's default mega menu markup must render. Tested in Task 7.
5. **Keyboard use of the mega menu** — Enter on "Shop" opens it, Tab reaches the tiles, Escape closes it. Tested in Task 7.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `playwright.config.js` (create, repo root) | Playwright pointed at the local preview | 1 |
| `tests/storefront/helpers.js` (create) | `openPage()` and `fg()` helpers | 1 |
| `tests/storefront/*.spec.js` (create) | One spec file per task | 1–8 |
| `shopify/theme/templates/page.help.json` (create) | Help page layout: page body + collapsible FAQ | 3 |
| `shopify/theme/sections/header-group.json` (modify) | Announcement bar messages; header menu type and new settings | 5, 6, 7 |
| `shopify/theme/sections/header.liquid` (modify) | Two new schema settings, transparent class, stylesheet links | 6, 7 |
| `shopify/theme/assets/bp-header.css` (create) | Transparent-header states only | 6 |
| `shopify/theme/snippets/header-mega-menu.liquid` (modify) | Mega menu markup incl. tiles branch | 7 |
| `shopify/theme/assets/bp-mega-menu.css` (create) | Tiles panel layout only | 7 |
| `shopify/theme/sections/footer-group.json` (modify) | Footer colour, blocks, toggles | 8 |

---

### Task 1: Storefront test harness

**Files:**
- Create: `playwright.config.js`
- Create: `tests/storefront/helpers.js`
- Create: `tests/storefront/smoke.spec.js`

**Interfaces:**
- Produces: `openPage(page, path)` from `tests/storefront/helpers.js` — navigates to `path` (relative to baseURL `http://127.0.0.1:9292`) and removes the Shopify cookie banner `#shopify-pc__banner`. Returns nothing.
- Produces: `fg(locator)` from the same file — resolves to the element's `--color-foreground` value with whitespace removed, e.g. `"43,43,43"`.

- [ ] **Step 1: Make sure the preview runs**

Run (from repo root, in a separate terminal, leave running):
```bash
cd shopify/theme && shopify theme dev --store qjhjk2-w3.myshopify.com
```
Expected: output contains `http://127.0.0.1:9292`. If it says `EADDRINUSE`, a preview is already running — use that one.

- [ ] **Step 2: Install the Chromium browser for Playwright Test**

Run: `npx playwright install chromium`
Expected: finishes without error (may say it is already installed).

- [ ] **Step 3: Write the config**

`playwright.config.js`:
```js
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
```

- [ ] **Step 4: Write the helpers**

`tests/storefront/helpers.js`:
```js
async function openPage(page, path) {
  await page.goto(path);
  await page.evaluate(() => document.querySelector('#shopify-pc__banner')?.remove());
}

async function fg(locator) {
  const value = await locator.evaluate((el) => getComputedStyle(el).getPropertyValue('--color-foreground'));
  return value.replace(/\s/g, '');
}

module.exports = { openPage, fg };
```

- [ ] **Step 5: Write the smoke test**

`tests/storefront/smoke.spec.js`:
```js
const { test, expect } = require('@playwright/test');
const { openPage } = require('./helpers');

test('preview serves the homepage with a header', async ({ page }) => {
  await openPage(page, '/');
  await expect(page.locator('.header-wrapper')).toBeVisible();
  await expect(page.locator('.section-header')).toHaveCount(1);
});
```

- [ ] **Step 6: Run it**

Run: `npx playwright test tests/storefront/smoke.spec.js`
Expected: `1 passed`.

- [ ] **Step 7: Commit**

```bash
git add playwright.config.js tests/storefront/helpers.js tests/storefront/smoke.spec.js
git commit -m "Add Playwright storefront test harness for the local preview"
```

---

### Task 2: Product-type collections (Admin)

**Files:**
- Test: `tests/storefront/collections.spec.js`

**Interfaces:**
- Produces: collections with handles `suitcases`, `bags-backpacks`, `organisers`, `comfort-kits` (used by menus in Task 4).

Current products and types: The Carry-On Companion (Suitcase), The Everyday Explorer Backpack (Backpack), The City Crossbody (Crossbody bag), The Family Road Trip Organizer Set (Organizer), The Flight Comfort Set (Travel comfort).

- [ ] **Step 1: Write the failing test**

`tests/storefront/collections.spec.js`:
```js
const { test, expect } = require('@playwright/test');

const expected = {
  suitcases: ['The Carry-On Companion'],
  'bags-backpacks': ['The City Crossbody', 'The Everyday Explorer Backpack'],
  organisers: ['The Family Road Trip Organizer Set'],
  'comfort-kits': ['The Flight Comfort Set'],
};

for (const [handle, titles] of Object.entries(expected)) {
  test(`collection ${handle} holds the right products`, async ({ request }) => {
    const res = await request.get(`/collections/${handle}/products.json`);
    expect(res.status()).toBe(200);
    const { products } = await res.json();
    expect(products.map((p) => p.title).sort()).toEqual([...titles].sort());
  });
}
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx playwright test tests/storefront/collections.spec.js`
Expected: 4 failed (status 404).

- [ ] **Step 3: Ask the merchant to approve the Admin batch**

Say in chat: "I'm about to create 4 automated collections in Admin (Suitcases, Bags & backpacks, Organisers, Comfort kits). OK?" Wait for yes.

- [ ] **Step 4: Create each collection in Chrome**

For each row, open `https://admin.shopify.com/store/qjhjk2-w3/collections/new` and:
1. Use `find` for the "Add title" button, click it by ref, type the title.
2. Use `find` for "Add description", click it by ref, click inside the editor, type the description.
3. Click "Add condition" → choose **Type** (product type) → operator **is equal to** → value. For Bags & backpacks add a second condition for the second type and set the match to **any condition**.
4. Confirm "Collection items" shows the expected count, then `find` the Save button and click it by ref.
5. After saving, open the Search engine listing section and confirm the URL handle; correct it to the handle below if Shopify generated a different one (leave "Create a URL redirect" checked).

Never type while focus is uncertain: always click an element found by `find` (by ref) first. Typing into the page body triggers Admin keyboard shortcuts.

| Title | Handle | Condition(s) | Description |
|---|---|---|---|
| Suitcases | `suitcases` | Type = Suitcase | Cabin-size and check-in cases that roll quietly and pack flat. |
| Bags & backpacks | `bags-backpacks` | Type = Backpack **or** Type = Crossbody bag | Day packs and crossbodies with a place for everything you reach for. |
| Organisers | `organisers` | Type = Organizer | Cubes and pouches that turn a full bag into clear sections. |
| Comfort kits | `comfort-kits` | Type = Travel comfort | Everything for a calmer flight, in one pouch. |

- [ ] **Step 5: Run the test to see it pass**

Run: `npx playwright test tests/storefront/collections.spec.js`
Expected: `4 passed`. If a storefront response is stale, wait 30 s and rerun.

- [ ] **Step 6: Commit**

```bash
git add tests/storefront/collections.spec.js
git commit -m "Add product-type collections test (collections created in Admin)"
```

---

### Task 3: About page, Help page and policies

**Files:**
- Create: `shopify/theme/templates/page.help.json`
- Test: `tests/storefront/pages.spec.js`

**Interfaces:**
- Produces: `/pages/about`, `/pages/help` (template `page.help`), `/policies/shipping-policy`, `/policies/refund-policy` (linked from the menus in Task 4).

- [ ] **Step 1: Write the failing test**

`tests/storefront/pages.spec.js`:
```js
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
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx playwright test tests/storefront/pages.spec.js`
Expected: failures with 404 for all paths.

- [ ] **Step 3: Create the Help page template**

`shopify/theme/templates/page.help.json`:
```json
{
  "sections": {
    "main": {
      "type": "main-page",
      "settings": {
        "padding_top": 36,
        "padding_bottom": 0
      }
    },
    "faq": {
      "type": "collapsible-content",
      "blocks": {
        "order": {
          "type": "collapsible_row",
          "settings": {
            "heading": "How do I place an order?",
            "icon": "box",
            "row_content": "<p>Add what you need to your cart and check out. You can pay with the methods shown at checkout. You'll get an order confirmation by email straight away.</p>"
          }
        },
        "ship_time": {
          "type": "collapsible_row",
          "settings": {
            "heading": "When will my order ship?",
            "icon": "truck",
            "row_content": "<p>We ship within [fill in] business days. Every order is tracked, and you'll get the tracking link by email as soon as it leaves our warehouse.</p>"
          }
        },
        "ship_cost": {
          "type": "collapsible_row",
          "settings": {
            "heading": "How much does shipping cost?",
            "icon": "price_tag",
            "row_content": "<p>[fill in]. You'll see the exact cost at checkout before you pay. Our <a href=\"/policies/shipping-policy\">shipping policy</a> lists delivery times per region.</p>"
          }
        },
        "returns": {
          "type": "collapsible_row",
          "settings": {
            "heading": "Can I return my order?",
            "icon": "return",
            "row_content": "<p>Yes. You have 14 days from delivery to change your mind. Our <a href=\"/policies/refund-policy\">refund policy</a> explains how to send it back.</p>"
          }
        },
        "warranty": {
          "type": "collapsible_row",
          "settings": {
            "heading": "What does the 2-year warranty cover?",
            "icon": "check_mark",
            "row_content": "<p>Every product comes with the 2-year legal guarantee that applies in the EU. If something stops working as it should because of a defect, we repair or replace it.</p>"
          }
        },
        "cabin": {
          "type": "collapsible_row",
          "settings": {
            "heading": "Will it fit as cabin baggage?",
            "icon": "plane",
            "row_content": "<p>Each bag and suitcase page has an airline cabin check that compares its size with the limits of major European airlines. Airlines change their rules, so confirm with yours before you fly.</p>"
          }
        },
        "contact": {
          "type": "collapsible_row",
          "settings": {
            "heading": "How do I reach you?",
            "icon": "chat_bubble",
            "row_content": "<p>Use our <a href=\"/pages/contact\">contact form</a> or email [fill in]. We reply within [fill in] business days.</p>"
          }
        }
      },
      "block_order": ["order", "ship_time", "ship_cost", "returns", "warranty", "cabin", "contact"],
      "settings": {
        "caption": "",
        "heading": "Questions before you pack?",
        "heading_size": "h1",
        "heading_alignment": "left",
        "layout": "none",
        "container_color_scheme": "scheme-1",
        "color_scheme": "scheme-1",
        "open_first_collapsible_row": false,
        "image_ratio": "adapt",
        "desktop_layout": "image_second",
        "padding_top": 24,
        "padding_bottom": 56
      }
    }
  },
  "order": ["main", "faq"]
}
```

- [ ] **Step 4: Validate the template**

Run: `cd shopify/theme && shopify theme check --path . --output json`
Expected: no offences whose `path` contains `page.help.json`.

- [ ] **Step 5: Ask the merchant to approve the Admin batch, and to publish the template**

Shopify's page-template picker lists the *live* theme's templates, so `page.help.json` must be on the live theme before the Help page can use it. The file is new and unused until assigned, so this changes nothing visible. Say in chat: "To assign the Help template I need to push one new, unused file (`templates/page.help.json`) to the live theme, then create 2 pages and fill 2 policies in Admin. OK?" Wait for yes.

Confirm the file does not exist on live yet (pull into an empty temp dir; expect no file):
```bash
mkdir -p "$TMP/bp-help" && cd "$TMP/bp-help" && shopify theme pull --live --store qjhjk2-w3.myshopify.com --path . --only templates/page.help.json && ls templates 2>/dev/null
```
Then push it:
```bash
cd shopify/theme && shopify theme push --live --store qjhjk2-w3.myshopify.com --only templates/page.help.json --allow-live
```
Expected: "pushed successfully".

- [ ] **Step 6: Create the About page in Chrome**

Open `https://admin.shopify.com/store/qjhjk2-w3/pages/new`. Title: `About`. Content (use the editor's `<>` HTML view, paste):
```html
<p>Travel should be the best part of the year. Yet for most of us it starts with packing stress, queues and uncomfortable hours on the way — all before the trip has really begun.</p>
<p>Basepacker exists to give that time back. We make travel lighter with thoughtful products that take the stress out of packing and make comfort on the way a given, so you can spend your energy on where you're going.</p>
<h3>What we stand for</h3>
<ul>
<li><strong>Thoughtful, not overloaded.</strong> Every product solves one real travel problem. No features you'll never use.</li>
<li><strong>Calm is the point.</strong> We sell bags and kits, but what you're really getting is knowing where everything is.</li>
<li><strong>Made to travel for years.</strong> Durable materials and solid finishing, built for many trips, not one holiday.</li>
<li><strong>Tested on real trips.</strong> We design from real situations — a family holiday, a weekend away, a long-haul flight — not from trends.</li>
</ul>
```
Theme template: Default page. Visibility: Visible. Save. Confirm the URL handle is `about`.

- [ ] **Step 7: Create the Help page in Chrome**

Open `https://admin.shopify.com/store/qjhjk2-w3/pages/new`. Title: `Help`. Content:
```html
<p>Straight answers about orders, shipping, returns and sizes. Can't find what you need? <a href="/pages/contact">Get in touch</a>.</p>
```
Theme template: **help**. Visibility: Visible. Save. Confirm handle `help`.

- [ ] **Step 8: Fill the Shipping and Refund policies in Chrome**

Open `https://admin.shopify.com/store/qjhjk2-w3/settings/legal`. In **Shipping policy** paste:
```html
<h3>Where we ship</h3>
<p>We ship to [fill in: countries or regions].</p>
<h3>Delivery times</h3>
<p>Orders leave our warehouse within [fill in] business days. Expected delivery after dispatch:</p>
<ul>
<li>Netherlands and Belgium: [fill in] business days</li>
<li>Rest of the EU: [fill in] business days</li>
<li>Rest of the world: [fill in] business days</li>
</ul>
<h3>Tracking</h3>
<p>Every order is shipped with tracking via [fill in: carrier]. You'll receive the tracking link by email once your order is on its way.</p>
<h3>Costs</h3>
<p>[fill in: shipping costs and any free-shipping threshold]. You'll see the exact cost at checkout before you pay.</p>
<h3>Customs and duties</h3>
<p>Orders within the EU have no customs charges. For destinations outside the EU, import duties and taxes may apply and are the recipient's responsibility.</p>
<h3>Questions</h3>
<p>Email [fill in] or use our <a href="/pages/contact">contact form</a>.</p>
```
In **Refund policy** paste:
```html
<h3>14 days to change your mind</h3>
<p>You can cancel your purchase within 14 days of receiving your order, without giving a reason. This is your right of withdrawal under EU law.</p>
<h3>How to return</h3>
<ol>
<li>Tell us within 14 days of delivery by emailing [fill in] or using our <a href="/pages/contact">contact form</a>, with your order number.</li>
<li>Send the product back within 14 days of telling us, to: [fill in: return address].</li>
<li>Pack it well. Products should be unused and complete, so we can accept them in the condition we sent them.</li>
</ol>
<h3>Return costs</h3>
<p>[fill in: who pays for return shipping].</p>
<h3>Refunds</h3>
<p>We refund the amount you paid, including the original standard shipping cost, within 14 days of receiving your cancellation. We may wait until the product is back with us or you've shown it's on its way. We refund using your original payment method.</p>
<h3>Warranty</h3>
<p>Separately from returns, every product has the 2-year legal guarantee that applies in the EU. If a product is defective, contact us and we'll repair or replace it.</p>
<h3>Seller details</h3>
<p>[fill in: company name, address, chamber of commerce number, VAT number]</p>
```
Save.

- [ ] **Step 9: Run the test to see it pass**

Run: `npx playwright test tests/storefront/pages.spec.js`
Expected: `5 passed`.

- [ ] **Step 10: Commit**

```bash
git add shopify/theme/templates/page.help.json tests/storefront/pages.spec.js
git commit -m "Add Help page template and pages/policies test"
```

---

### Task 4: Menus (Admin)

**Files:**
- Test: `tests/storefront/menus.spec.js`

**Interfaces:**
- Consumes: collections from Task 2, pages and policies from Task 3.
- Produces: menu `main-menu` whose top-level item "Shop" has children titled exactly `By trip` and `By product` (Task 7 matches the title `By trip`); menus with handles `footer-shop` and `footer-help` (Task 8).

- [ ] **Step 1: Write the failing test**

`tests/storefront/menus.spec.js`:
```js
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
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx playwright test tests/storefront/menus.spec.js`
Expected: FAIL (links not attached).

- [ ] **Step 3: Ask the merchant to approve the Admin batch**

Say: "I'm about to rebuild the Main menu and add two footer menus in Admin. The current Main menu items (Home, Assortiment, Contact) will be replaced. OK?" Wait for yes.

- [ ] **Step 4: Edit the Main menu in Chrome**

Open `https://admin.shopify.com/store/qjhjk2-w3/content/menus`, open **Main menu**. Remove the existing items from the menu (this removes menu entries only, not pages). Add, dragging to nest:

```
Shop                → Collections: All products (/collections/all)
  By trip           → link "#"   (use the Carry-on only collection if "#" is refused)
    Carry-on only       → Collection: Carry-on only
    Family road trips   → Collection: Family road trips
    Weekend getaways    → Collection: Weekend getaways
  By product        → link "#"   (use the Suitcases collection if "#" is refused)
    Suitcases           → Collection: Suitcases
    Bags & backpacks    → Collection: Bags & backpacks
    Organisers          → Collection: Organisers
    Comfort kits        → Collection: Comfort kits
About               → Page: About
Help                → Page: Help
```
The second-level titles must be exactly `By trip` and `By product`. Save.

- [ ] **Step 5: Create the footer menus in Chrome**

On the Menus page click **Add menu**.
- Title `Footer: Shop`, handle `footer-shop`: Carry-on only, Family road trips, Weekend getaways (collections), All products (`/collections/all`). Save.
- Title `Footer: Help`, handle `footer-help`: Shipping → Policy: Shipping policy; Returns → Policy: Refund policy; FAQ → Page: Help; Contact → Page: Contact. Save.

- [ ] **Step 6: Run the test to see it pass**

Run: `npx playwright test tests/storefront/menus.spec.js`
Expected: `1 passed`.

- [ ] **Step 7: Commit**

```bash
git add tests/storefront/menus.spec.js
git commit -m "Add main menu test (menus configured in Admin)"
```

---

### Task 5: Announcement bar

**Files:**
- Modify: `shopify/theme/sections/header-group.json` (section `announcement-bar`)
- Test: `tests/storefront/announcement.spec.js`

- [ ] **Step 1: Write the failing test**

`tests/storefront/announcement.spec.js`:
```js
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
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx playwright test tests/storefront/announcement.spec.js`
Expected: FAIL (1 message, "Welcome to our store").

- [ ] **Step 3: Update the section settings**

In `sections/header-group.json`, replace the `announcement-bar` section's `blocks`, `block_order` and `settings` with:
```json
"blocks": {
  "shipping": { "type": "announcement", "settings": { "text": "Tracked shipping across Europe", "link": "shopify://policies/shipping-policy" } },
  "returns": { "type": "announcement", "settings": { "text": "14-day returns", "link": "shopify://policies/refund-policy" } },
  "warranty": { "type": "announcement", "settings": { "text": "2-year warranty", "link": "" } }
},
"block_order": ["shipping", "returns", "warranty"],
"settings": {
  "auto_rotate": true,
  "change_slides_speed": 5,
  "color_scheme": "scheme-3",
  "show_line_separator": false,
  "show_social": false,
  "enable_country_selector": false,
  "enable_language_selector": false
}
```
Keep the file's leading comment block intact: edit with a Node script that strips the `/* … */` header, parses, modifies and re-adds the header.

- [ ] **Step 4: Run the test to see it pass**

Run: `npx playwright test tests/storefront/announcement.spec.js`
Expected: `1 passed`. If `.utility-bar` is not the element carrying the colour, inspect with `page.locator('.utility-bar').evaluate(el => el.outerHTML.slice(0, 300))` and point the test at the element with class `color-scheme-3`.

- [ ] **Step 5: Commit**

```bash
git add shopify/theme/sections/header-group.json tests/storefront/announcement.spec.js
git commit -m "Announcement bar: three rotating brand messages on deep blue"
```

---

### Task 6: Transparent header on the homepage

**Files:**
- Create: `shopify/theme/assets/bp-header.css`
- Modify: `shopify/theme/sections/header.liquid` (stylesheet links near line 14; wrapper class near line 150; schema settings after `menu_type_desktop` near line 556)
- Modify: `shopify/theme/sections/header-group.json` (header settings)
- Test: `tests/storefront/header-transparent.spec.js`

**Interfaces:**
- Produces: header setting `bp_transparent_home` (checkbox, default `true`); class `bp-header--transparent` on `.header-wrapper` when that setting is on and `template.name == 'index'`.
- Consumes (Dawn): `.section-header` gets `shopify-section-header-sticky` when revealed after scrolling; `--header-height` on `:root`.

- [ ] **Step 1: Write the failing tests**

`tests/storefront/header-transparent.spec.js`:
```js
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
  await page.locator('header-drawer summary').click();
  await expect.poll(() => fg(wrapper)).toBe(DARK);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx playwright test tests/storefront/header-transparent.spec.js`
Expected: the homepage, hero and mobile tests FAIL (no `bp-header--transparent` class); the "other pages" test passes.

- [ ] **Step 3: Create the stylesheet**

`shopify/theme/assets/bp-header.css`:
```css
/* Basepacker: transparent header over the homepage hero.
   Dawn adds .shopify-section-header-sticky when the header is revealed after scrolling;
   any open <details> (mega menu, drawer, search) also switches the header to solid. */

.section-header:has(.bp-header--transparent) {
  margin-bottom: calc(-1 * var(--header-height));
}

.section-header:not(.shopify-section-header-sticky):not(:has(details[open])) .bp-header--transparent {
  --color-foreground: 250, 248, 244;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0));
  background-color: transparent;
  border-bottom-color: transparent;
}

.section-header.shopify-section-header-sticky .bp-header--transparent {
  box-shadow: 0 0.2rem 1.2rem rgba(43, 43, 43, 0.08);
}
```

- [ ] **Step 4: Load it and add the class in `header.liquid`**

After the `{%- if section.settings.menu_type_desktop == 'mega' -%} … {%- endif -%}` stylesheet block (around line 14–16), add:
```liquid
{%- liquid
  assign bp_transparent = false
  if section.settings.bp_transparent_home and template.name == 'index'
    assign bp_transparent = true
  endif
-%}
{%- if bp_transparent -%}
  {{ 'bp-header.css' | asset_url | stylesheet_tag }}
{%- endif -%}
```
In the wrapper element (the `<{{ header_tag }}` opening tag, around line 146–151), change the class attribute to:
```liquid
  class="header-wrapper color-{{ section.settings.color_scheme }} gradient{% if section.settings.show_line_separator %} header-wrapper--border-bottom{% endif %}{% if bp_transparent %} bp-header--transparent{% endif %}"
```
The stylesheet is loaded render-blocking on purpose, so the transparent state never flashes solid on load.

- [ ] **Step 5: Add the schema setting**

In the `{% schema %}` `settings` array of `header.liquid`, directly after the object whose `"id"` is `"menu_type_desktop"`, insert:
```json
{
  "type": "checkbox",
  "id": "bp_transparent_home",
  "label": "Transparent on homepage",
  "info": "Header sits over the first section on the homepage and turns solid when scrolled or when a menu opens.",
  "default": true
},
```

- [ ] **Step 6: Set it in the header group**

In `sections/header-group.json`, in the `header` section `settings`, add `"bp_transparent_home": true`.

- [ ] **Step 7: Validate**

Run: `cd shopify/theme && shopify theme check --path . --output json`
Expected: no offences whose `path` is `sections/header.liquid` or `assets/bp-header.css`.

- [ ] **Step 8: Run the tests to see them pass**

Run: `npx playwright test tests/storefront/header-transparent.spec.js`
Expected: `5 passed`.

- [ ] **Step 9: Look at it**

Take full-page screenshots of `/` at 1440×900 and 390×844 (top of page, and after scrolling down then up). Confirm by eye: white logo and icons readable over the hero; no gap between announcement bar and hero; solid off-white header after scrolling up.

- [ ] **Step 10: Commit**

```bash
git add shopify/theme/assets/bp-header.css shopify/theme/sections/header.liquid shopify/theme/sections/header-group.json tests/storefront/header-transparent.spec.js
git commit -m "Transparent header over the homepage hero, solid when scrolled or a menu opens"
```

---

### Task 7: Mega menu with image tiles

**Files:**
- Modify (full rewrite): `shopify/theme/snippets/header-mega-menu.liquid`
- Create: `shopify/theme/assets/bp-mega-menu.css`
- Modify: `shopify/theme/sections/header.liquid` (stylesheet link, schema setting)
- Modify: `shopify/theme/sections/header-group.json` (`menu_type_desktop`, `bp_mega_tiles_column`)
- Test: `tests/storefront/mega-menu.spec.js`

**Interfaces:**
- Consumes: main menu from Task 4 (top-level `Shop`, child titled `By trip` whose children are collection links); `bp-header--transparent` from Task 6.
- Produces: header setting `bp_mega_tiles_column` (text, default `By trip`); markup `.bp-mega` > `.bp-mega__columns` + `ul.bp-mega__tiles` > `li` > `a.bp-mega__tile` containing either `img.bp-mega__tile-image` or `span.bp-mega__tile-placeholder`, plus `span.bp-mega__tile-caption`.

- [ ] **Step 1: Write the failing tests**

`tests/storefront/mega-menu.spec.js`:
```js
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { openPage, fg } = require('./helpers');

const TRIPS = ['/collections/carry-on-only', '/collections/family-road-trips', '/collections/weekend-getaways'];

async function openShop(page) {
  await page.locator('.header__inline-menu summary', { hasText: 'Shop' }).hover();
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
    await page.locator('.header__inline-menu summary', { hasText: 'Shop' }).hover();
    await expect(page.locator('.mega-menu__list')).toBeVisible();
    await expect(page.locator('.bp-mega')).toHaveCount(0);
  } finally {
    fs.writeFileSync(file, original);
    await page.waitForTimeout(6000);
  }
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx playwright test tests/storefront/mega-menu.spec.js`
Expected: FAIL — `.bp-mega` not found (menu is still a dropdown). The mobile test may already pass.

- [ ] **Step 3: Rewrite the snippet**

First save the original for comparison: `git show HEAD:shopify/theme/snippets/header-mega-menu.liquid > "$TMP/header-mega-menu.orig.liquid"`.

Replace the file from the top down to (and including) the first `{%- else -%}` that precedes the plain top-level link with:
```liquid
{% comment %}
  Renders a megamenu for the header.
  Basepacker: a top-level item whose children include the column named in
  section.settings.bp_mega_tiles_column gets text columns plus image tiles
  (one tile per link in that column). Other items keep Dawn's default markup.

  Usage:
  {% render 'header-mega-menu' %}
{% endcomment %}

<nav class="header__inline-menu">
  <ul class="list-menu list-menu--inline" role="list">
    {%- for link in section.settings.menu.links -%}
      <li>
        {%- if link.links != blank -%}
          {%- liquid
            assign tiles_link = nil
            for childlink in link.links
              if childlink.title == section.settings.bp_mega_tiles_column
                assign tiles_link = childlink
              endif
            endfor
          -%}
          <header-menu>
            <details id="Details-HeaderMenu-{{ forloop.index }}" class="mega-menu">
              <summary
                id="HeaderMenu-{{ link.handle }}"
                class="header__menu-item list-menu__item link focus-inset"
              >
                <span
                  {%- if link.child_active %}
                    class="header__active-menu-item"
                  {% endif %}
                >
                  {{- link.title | escape -}}
                </span>
                {{- 'icon-caret.svg' | inline_asset_content -}}
              </summary>
              <div
                id="MegaMenu-Content-{{ forloop.index }}"
                class="mega-menu__content color-{{ section.settings.menu_color_scheme }} gradient motion-reduce global-settings-popup"
                tabindex="-1"
              >
                {%- if tiles_link and tiles_link.links != blank -%}
                  <div class="bp-mega page-width">
                    <div class="bp-mega__columns">
                      {%- for childlink in link.links -%}
                        <div class="bp-mega__column">
                          <p class="bp-mega__heading caption-with-letter-spacing">{{ childlink.title | escape }}</p>
                          <ul class="list-unstyled" role="list">
                            {%- for grandchildlink in childlink.links -%}
                              <li>
                                <a
                                  id="HeaderMenu-{{ link.handle }}-{{ childlink.handle }}-{{ grandchildlink.handle }}"
                                  href="{{ grandchildlink.url }}"
                                  class="mega-menu__link link{% if grandchildlink.current %} mega-menu__link--active{% endif %}"
                                  {% if grandchildlink.current %}
                                    aria-current="page"
                                  {% endif %}
                                >
                                  {{ grandchildlink.title | escape }}
                                </a>
                              </li>
                            {%- endfor -%}
                          </ul>
                        </div>
                      {%- endfor -%}
                      <a href="{{ link.url }}" class="bp-mega__all link">
                        Shop all products <span aria-hidden="true">→</span>
                      </a>
                    </div>
                    <ul class="bp-mega__tiles" role="list">
                      {%- for tile in tiles_link.links -%}
                        {%- liquid
                          assign tile_image = nil
                          if tile.type == 'collection_link'
                            assign tile_image = tile.object.featured_image
                          endif
                        -%}
                        <li>
                          <a href="{{ tile.url }}" class="bp-mega__tile">
                            {%- if tile_image -%}
                              {{
                                tile_image
                                | image_url: width: 600
                                | image_tag:
                                  loading: 'lazy',
                                  class: 'bp-mega__tile-image',
                                  widths: '300, 450, 600',
                                  sizes: '(min-width: 990px) 18vw, 100vw',
                                  alt: ''
                              }}
                            {%- else -%}
                              <span class="bp-mega__tile-placeholder" aria-hidden="true">{{ tile.title | escape }}</span>
                            {%- endif -%}
                            <span class="bp-mega__tile-caption">
                              {{- tile.title | escape }} <span aria-hidden="true">→</span>
                            </span>
                          </a>
                        </li>
                      {%- endfor -%}
                    </ul>
                  </div>
                {%- else -%}
                  <ul
                    class="mega-menu__list page-width{% if link.levels == 1 %} mega-menu__list--condensed{% endif %}"
                    role="list"
                  >
                    {%- for childlink in link.links -%}
                      <li>
                        <a
                          id="HeaderMenu-{{ link.handle }}-{{ childlink.handle }}"
                          href="{{ childlink.url }}"
                          class="mega-menu__link mega-menu__link--level-2 link{% if childlink.current %} mega-menu__link--active{% endif %}"
                          {% if childlink.current %}
                            aria-current="page"
                          {% endif %}
                        >
                          {{ childlink.title | escape }}
                        </a>
                        {%- if childlink.links != blank -%}
                          <ul class="list-unstyled" role="list">
                            {%- for grandchildlink in childlink.links -%}
                              <li>
                                <a
                                  id="HeaderMenu-{{ link.handle }}-{{ childlink.handle }}-{{ grandchildlink.handle }}"
                                  href="{{ grandchildlink.url }}"
                                  class="mega-menu__link link{% if grandchildlink.current %} mega-menu__link--active{% endif %}"
                                  {% if grandchildlink.current %}
                                    aria-current="page"
                                  {% endif %}
                                >
                                  {{ grandchildlink.title | escape }}
                                </a>
                              </li>
                            {%- endfor -%}
                          </ul>
                        {%- endif -%}
                      </li>
                    {%- endfor -%}
                  </ul>
                {%- endif -%}
              </div>
            </details>
          </header-menu>
        {%- else -%}
```
Keep everything after that original `{%- else -%}` (the plain `<a id="HeaderMenu-{{ link.handle }}" …>` link through the end of the file) unchanged.

Then diff: `git diff --no-index "$TMP/header-mega-menu.orig.liquid" shopify/theme/snippets/header-mega-menu.liquid`. The only changes must be the comment, the `tiles_link` liquid block, and the `{%- if tiles_link … -%} … {%- else -%} … {%- endif -%}` wrapper around the original `<ul class="mega-menu__list …">`.

- [ ] **Step 4: Create the panel stylesheet**

`shopify/theme/assets/bp-mega-menu.css`:
```css
/* Basepacker mega menu: text columns left, trip tiles right. */

.bp-mega {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  gap: 4rem;
  padding-top: 3.2rem;
  padding-bottom: 3.2rem;
}

.bp-mega__columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2.4rem 3.2rem;
  align-content: start;
}

.bp-mega__heading {
  margin: 0 0 1.2rem;
  color: rgba(var(--color-foreground), 0.7);
}

.bp-mega__columns .mega-menu__link {
  padding: 0.6rem 0;
}

.bp-mega__all {
  grid-column: 1 / -1;
  font-size: 1.4rem;
  text-underline-offset: 0.3rem;
}

.bp-mega__tiles {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.6rem;
}

.bp-mega__tile {
  display: block;
  color: rgb(var(--color-foreground));
  text-decoration: none;
}

.bp-mega__tile-image,
.bp-mega__tile-placeholder {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
}

.bp-mega__tile-placeholder {
  display: flex;
  align-items: flex-end;
  padding: 1.6rem;
  background-color: #e8dcc8;
  color: #2b2b2b;
  font-family: var(--font-heading-family);
  font-size: 2rem;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.bp-mega__tile-caption {
  display: block;
  margin-top: 0.8rem;
  font-size: 1.4rem;
}

.bp-mega__tile:hover .bp-mega__tile-caption,
.bp-mega__tile:focus-visible .bp-mega__tile-caption {
  text-decoration: underline;
  text-underline-offset: 0.3rem;
}
```

- [ ] **Step 5: Load it and add the setting in `header.liquid`**

Inside the existing `{%- if section.settings.menu_type_desktop == 'mega' -%}` stylesheet block (line ~14), after the `component-mega-menu.css` link, add:
```liquid
  {{ 'bp-mega-menu.css' | asset_url | stylesheet_tag }}
```
In the schema `settings`, directly after the `bp_transparent_home` object from Task 6, insert:
```json
{
  "type": "text",
  "id": "bp_mega_tiles_column",
  "label": "Mega menu image tiles column",
  "info": "Title of the second-level menu item whose links show as image tiles, e.g. By trip. Leave empty for Dawn's standard mega menu.",
  "default": "By trip"
},
```

- [ ] **Step 6: Switch the header to mega menu**

In `sections/header-group.json`, header `settings`: set `"menu_type_desktop": "mega"` and add `"bp_mega_tiles_column": "By trip"`.

- [ ] **Step 7: Validate**

Run: `cd shopify/theme && shopify theme check --path . --output json`
Expected: no offences for `snippets/header-mega-menu.liquid`, `sections/header.liquid`, `assets/bp-mega-menu.css`.

- [ ] **Step 8: Run the tests to see them pass**

Run: `npx playwright test tests/storefront/mega-menu.spec.js`
Expected: `6 passed`.

If only the keyboard test fails at the Escape step (Dawn's `header-menu` not closing on Escape), append this to the end of `snippets/header-mega-menu.liquid` and rerun:
```liquid
<script>
  document.addEventListener('keyup', (event) => {
    if (event.code !== 'Escape') return;
    const open = document.querySelector('.header__inline-menu details.mega-menu[open]');
    if (!open) return;
    open.removeAttribute('open');
    open.querySelector('summary').focus();
  });
</script>
```

- [ ] **Step 9: Look at it**

Screenshot `/collections/all` with the Shop panel open at 1440×900, and `/` with the panel open over the transparent header. Confirm by eye: columns left, three portrait tiles right, sand placeholders with titles in Fraunces, header solid while open.

- [ ] **Step 10: Commit**

```bash
git add shopify/theme/snippets/header-mega-menu.liquid shopify/theme/assets/bp-mega-menu.css shopify/theme/sections/header.liquid shopify/theme/sections/header-group.json tests/storefront/mega-menu.spec.js
git commit -m "Mega menu: text columns plus trip image tiles with sand placeholders"
```

---

### Task 8: Footer

**Files:**
- Modify: `shopify/theme/sections/footer-group.json`
- Test: `tests/storefront/footer.spec.js`

**Interfaces:**
- Consumes: menus `footer-shop`, `footer-help` from Task 4.

- [ ] **Step 1: Write the failing test**

`tests/storefront/footer.spec.js`:
```js
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
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx playwright test tests/storefront/footer.spec.js`
Expected: FAIL (background off-white, no columns).

- [ ] **Step 3: Update the footer group**

In `sections/footer-group.json`, set the `footer` section's `blocks`, `block_order` and `settings` to (keep `"type": "footer"` and the file's leading comment):
```json
"blocks": {
  "brand": {
    "type": "text",
    "settings": {
      "heading": "Basepacker",
      "subtext": "<p>We make travel lighter, so you can arrive ready.</p>"
    }
  },
  "shop": {
    "type": "link_list",
    "settings": { "heading": "Shop", "menu": "footer-shop" }
  },
  "help": {
    "type": "link_list",
    "settings": { "heading": "Help", "menu": "footer-help" }
  }
},
"block_order": ["brand", "shop", "help"],
"settings": {
  "color_scheme": "scheme-3",
  "newsletter_enable": false,
  "newsletter_heading": "Subscribe to our emails",
  "enable_follow_on_shop": false,
  "show_social": false,
  "enable_country_selector": false,
  "enable_language_selector": false,
  "payment_enable": true,
  "show_policy": true,
  "margin_top": 0,
  "padding_top": 48,
  "padding_bottom": 36
}
```

- [ ] **Step 4: Run the test to see it pass**

Run: `npx playwright test tests/storefront/footer.spec.js`
Expected: `2 passed`. If the heading class differs, inspect the `footer .footer-block` markup and update the selector, not the design.

- [ ] **Step 5: Look at it**

Screenshot the footer at 1440 and 390 px. Confirm: three columns on desktop, stacked on mobile with the brand block first, payment icons and policy links on the bottom row.

- [ ] **Step 6: Commit**

```bash
git add shopify/theme/sections/footer-group.json tests/storefront/footer.spec.js
git commit -m "Footer: deep blue with brand text, Shop and Help columns"
```

---

### Task 9: Full check and go live

**Files:**
- No new files.

- [ ] **Step 1: Run every storefront test**

Run: `npx playwright test`
Expected: all tests in `tests/storefront/` pass. (`tests/example.spec.js` is outside `testDir` and is not run.)

- [ ] **Step 2: Theme check on all changed files**

Run: `cd shopify/theme && shopify theme check --path . --output json`
Expected: no offences for any file changed in Tasks 3–8.

- [ ] **Step 3: Ask the merchant to go live**

Say in chat which files will be pushed: `sections/header-group.json`, `sections/header.liquid`, `snippets/header-mega-menu.liquid`, `assets/bp-header.css`, `assets/bp-mega-menu.css`, `sections/footer-group.json`. Wait for an explicit yes.

- [ ] **Step 4: Pre-check live copies**

Pull the live copies into a temp directory:
```bash
mkdir -p "$TMP/bp-live" && cd "$TMP/bp-live" && shopify theme pull --live --store qjhjk2-w3.myshopify.com --path . --only sections/header-group.json --only sections/header.liquid --only snippets/header-mega-menu.liquid --only sections/footer-group.json
```
Compare each with the version in the last commit before Task 5 (`git log --oneline` to find it; `git show <sha>:shopify/theme/<file>`), parsing JSON files and comparing content (key order may differ). Expected: identical content. If any differs, stop and show the merchant the difference.

- [ ] **Step 5: Push**

```bash
cd shopify/theme && shopify theme push --live --store qjhjk2-w3.myshopify.com --allow-live --only sections/header-group.json --only sections/header.liquid --only snippets/header-mega-menu.liquid --only assets/bp-header.css --only assets/bp-mega-menu.css --only sections/footer-group.json
```
Expected: "pushed successfully".

- [ ] **Step 6: Verify live**

Re-pull the same files and confirm each equals the local file (JSON by content). Then push the commits to GitHub: `git push origin master`.

- [ ] **Step 7: Report merchant actions**

List for the merchant: change store name to "Basepacker"; generate Privacy and Terms policies from Shopify templates; fill in every `[fill in]` (search for it in Pages and Policies); have the policies checked; add images to the trip collections.
