# Header & footer — design

**Date:** 2026-09-27
**Store:** qjhjk2-w3.myshopify.com (Dawn, live theme #193596588298)
**Status:** approved in chat, pending review of this document

## Goal

Replace the stock Dawn header and footer with a branded version that feels premium and calm, puts "shop by trip" at the centre of navigation, and gives the footer real content. Built on Dawn (approach 1): extend, don't replace.

## Competitor findings (2026-09-27)

Checked Away, Béis, Monos, Db and Calpak.

- Only Monos uses a transparent header over the hero; it switches to solid white when a menu opens.
- Every brand with a mega menu puts text columns left and image tiles right (Away, Monos: two tiles; Béis: one tile + CTA; Db: one tall image).
- Only Db ("Activity") and Away ("Family travel") navigate by use case. For Basepacker this is the core differentiator, so "By trip" gets the prominent place.
- Monos uses a dark three-column footer.
- Not adopted: visible search bar (Béis, Db), "Quiz" button and floating pill header (Calpak).

## 1. Announcement bar

- Colour scheme 3 (deep blue `#1D3B53`, off-white text), no separator line.
- Three auto-rotating messages, 5 s interval:
  1. Tracked shipping across Europe
  2. 14-day returns
  3. 2-year warranty
- Settings only, in `sections/header-group.json`.

## 2. Header

### Default (all pages except homepage)

- Colour scheme 1 (off-white), line separator on.
- Logo: store name as wordmark in Fraunces. Store name must change from "Mijn winkel" to "Basepacker" (merchant action, Settings → General).
- Menu: Shop (mega menu) · About · Help. Search, account and cart icons unchanged.
- Sticky behaviour: Dawn's existing "on scroll up".

### Transparent (homepage only)

- New header setting `bp_transparent_home` (checkbox, default on).
- On the index template, at the top of the page, the header sits over the hero with a transparent background and white logo, menu and icons.
- The header becomes solid off-white with a soft shadow when:
  - it re-appears as the sticky header after scrolling, or
  - the mega menu (or any header dropdown / drawer) is open.
- A subtle dark gradient over the top of the hero keeps white header text legible on any image.
- The hero starts under the header: a small script measures the header height and exposes it as a CSS variable; the header wrapper pulls up by that amount only on the homepage.
- Announcement bar stays above the header, in blue.
- Same behaviour on mobile.

## 3. Mega menu

### Menu structure (Admin → Content → Menus → Main menu)

```
Shop                → /collections/all
├─ By trip
│   ├─ Carry-on only        → /collections/carry-on-only
│   ├─ Family road trips    → /collections/family-road-trips
│   └─ Weekend getaways     → /collections/weekend-getaways
└─ By product
    ├─ Suitcases            → /collections/suitcases
    ├─ Bags & backpacks     → /collections/bags-backpacks
    ├─ Organisers           → /collections/organisers
    └─ Comfort kits         → /collections/comfort-kits
About               → /pages/about
Help                → /pages/help
```

### New automated collections (by product type)

| Collection | Handle | Condition |
|---|---|---|
| Suitcases | `suitcases` | Product type = Suitcase |
| Bags & backpacks | `bags-backpacks` | Product type = Backpack **or** Crossbody bag |
| Organisers | `organisers` | Product type = Organizer |
| Comfort kits | `comfort-kits` | Product type = Travel comfort |

Each gets a one-sentence English description in the brand tone.

### Panel layout (desktop)

Full width, off-white, content constrained to page width.

- Left: text columns (one per second-level item) with small uppercase headings, then "Shop all products →" linking to the top-level item's URL.
- Right: portrait image tiles, one per link under the tile column, each with the collection title and an arrow as caption.
- Tile image = the linked collection's image. Without an image: sand (`#E8DCC8`) tile with the title in Fraunces.
- The tile column is chosen by a new header setting `bp_mega_tiles_column` (text, default "By trip"), matched against the second-level item title. Only a top-level item that contains that column gets the new panel; other items with children keep Dawn's default mega menu markup.

### Technical

- Edit `snippets/header-mega-menu.liquid`; add the two settings to the `header.liquid` schema; set `menu_type_desktop` to `mega`.
- Keep Dawn's `<details>` / `<header-menu>` mechanics so keyboard and screen reader behaviour is unchanged. Tiles are plain links with the collection title as text.

### Mobile

Dawn's drawer menu unchanged (text only: Shop → By trip / By product → links). No tiles in the drawer.

## 4. Footer

- Colour scheme 3 (deep blue, off-white text).
- Column 1: text block with "Basepacker" wordmark (Fraunces) and "We make travel lighter, so you can arrive ready."
- Column 2: menu block "Shop" → new menu *Footer: Shop* (Carry-on only, Family road trips, Weekend getaways, All products).
- Column 3: menu block "Help" → new menu *Footer: Help* (Shipping → `/policies/shipping-policy`, Returns → `/policies/refund-policy`, FAQ → `/pages/help`, Contact → `/pages/contact`).
- Bottom row: copyright (store name), policy links, payment icons (all Dawn defaults).
- Off: Follow on Shop, country and language selectors (already in header), newsletter (on homepage), social icons (none configured yet).
- Settings and blocks only, in `sections/footer-group.json`.

## 5. Pages & policies

| Item | Where | Content |
|---|---|---|
| About | page `/pages/about` | ~200 words: why, mission, four core values (brand strategy §1.2) |
| Help / FAQ | page `/pages/help`, template `page.help` | Dawn collapsible-content section: ordering, shipping, returns, warranty, cabin sizes, contact |
| Shipping policy | Settings → Policies | Tracked shipping, delivery times per region, costs |
| Refund policy | Settings → Policies | 14-day right of withdrawal, how to return, refund within 14 days, 2-year legal guarantee |
| Privacy, Terms | Settings → Policies | Merchant generates from Shopify's templates; not written by Claude |

Unknowns are marked `[fill in]`: delivery times per region, shipping costs, carrier, return address, company name and registration number, contact email.

Tone: calm and concrete, no hype (brand strategy §1.3).

Legal: shipping and refund texts are a starting point based on EU rules; the merchant has them checked before launch.

## Where changes live

| Change | Location | Method |
|---|---|---|
| Announcement bar, header settings | `sections/header-group.json` | theme file |
| Transparent header, mega menu settings | `sections/header.liquid` | theme code |
| Mega menu panel | `snippets/header-mega-menu.liquid` | theme code |
| Footer | `sections/footer-group.json` | theme file |
| Help page template | `templates/page.help.json` | theme file |
| Menus, collections, pages, policies | Shopify Admin | via browser, with merchant approval |
| Store name | Shopify Admin | merchant |

## Testing

- `shopify theme check` clean for changed files.
- Preview at desktop (1440 px) and mobile (390 px): homepage transparent state, scrolled state, mega menu open over transparent header, non-home pages, footer.
- Keyboard: open and close the mega menu with Tab / Enter / Escape.
- All menu links and footer links return 200 in the preview.
- Before each live push: confirm the live copies of changed files match the last commit (editor changes), then push only those files and re-pull to verify.

## Merchant actions

1. Change store name to "Basepacker" (Settings → General).
2. Generate Privacy and Terms policies from Shopify templates.
3. Fill in the `[fill in]` placeholders and have the policies checked.
4. Add collection images for the trip collections (used by the mega menu tiles).
