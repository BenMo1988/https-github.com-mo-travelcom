// Renders a Shopify section locally with liquidjs and placeholder product data,
// so the output can be viewed without a live store.
// Usage: npm run preview
import { Liquid } from 'liquidjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// Sections in the order they appear on the product page
const sectionNames = ['bp-usp-bar', 'bp-travel-specs', 'bp-faq'];
const outName = 'bp-travel-specs';

// Placeholder products, same values as shopify/data/placeholder-products.csv
const products = [
  {
    title: 'The Carry-On Companion',
    type: 'Suitcase',
    metafields: { height_cm: 55, width_cm: 40, depth_cm: 20, weight_kg: 2.3, capacity_l: 40, material: 'Polycarbonate shell' },
  },
  {
    title: 'The Everyday Explorer Backpack',
    type: 'Backpack',
    metafields: { height_cm: 45, width_cm: 30, depth_cm: 18, weight_kg: 0.9, capacity_l: 25, material: 'Ripstop nylon' },
  },
  {
    title: 'The Family Road Trip Organizer Set',
    type: 'Organizer',
    metafields: { material: 'Water-repellent polyester' },
  },
];

// Load a section file and fill it with its schema defaults and first preset, like the theme editor does
function loadSection(name) {
  const source = readFileSync(join(root, 'theme', 'sections', `${name}.liquid`), 'utf8');
  const schema = JSON.parse(source.match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/)[1]);
  const template = source
    .replace(/{%\s*schema\s*%}[\s\S]*?{%\s*endschema\s*%}/, '')
    .replace(/{%-?\s*style\s*-?%}/g, '<style>')
    .replace(/{%-?\s*endstyle\s*-?%}/g, '</style>');
  const settings = Object.fromEntries(
    schema.settings.filter((s) => 'default' in s).map((s) => [s.id, s.default])
  );
  const blockDefaults = Object.fromEntries(
    (schema.blocks || []).map((b) => [
      b.type,
      Object.fromEntries((b.settings || []).filter((s) => 'default' in s).map((s) => [s.id, s.default])),
    ])
  );
  const blocks = (schema.presets?.[0]?.blocks || []).map((b) => ({
    ...b,
    settings: { ...blockDefaults[b.type], ...b.settings },
    shopify_attributes: '',
  }));
  return { name, template, settings, blocks };
}

const sections = sectionNames.map(loadSection);
const engine = new Liquid();
const wrap = (mf) => Object.fromEntries(Object.entries(mf).map(([k, v]) => [k, { value: v }]));

const panels = [];
for (const [i, p] of products.entries()) {
  let html = '';
  for (const s of sections) {
    html += await engine.parseAndRender(s.template, {
      product: { title: p.title, type: p.type, metafields: { basepacker: wrap(p.metafields) } },
      section: { id: `${s.name}-${i}`, settings: s.settings, blocks: s.blocks },
      localization: { country: { iso_code: 'NL' } },
      request: { design_mode: false },
    });
  }
  panels.push({ title: p.title, html });
}

const page = `<title>Basepacker Product Page</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Inter:wght@400;600&display=swap">
<style>
  /* Mimics Dawn's base: 62.5% root so 1rem = 10px, theme font variables, page-width */
  html { font-size: 62.5%; }
  body {
    margin: 0;
    background: #FAF8F4;
    color: #2B2B2B;
    font-family: var(--font-body-family);
    font-size: 1.5rem;
    line-height: 1.6;
    --font-heading-family: 'Fraunces', Georgia, serif;
    --font-body-family: 'Inter', system-ui, sans-serif;
  }
  .page-width { max-width: 120rem; margin: 0 auto; padding: 0 1.5rem; }
  .visually-hidden { position: absolute !important; overflow: hidden; width: 1px; height: 1px; margin: -1px; padding: 0; border: 0; clip: rect(0 0 0 0); word-wrap: normal !important; }
  @media (min-width: 750px) { .page-width { padding: 0 5rem; } }
  .pv-bar { background: #1D3B53; color: #FAF8F4; padding-block: 1.2rem; }
  .pv-bar .page-width { display: flex; flex-wrap: wrap; gap: 0.8rem 1.6rem; align-items: center; }
  .pv-bar p { margin: 0; font-size: 1.3rem; opacity: 0.85; flex: 1 1 24rem; }
  .pv-tabs { display: flex; flex-wrap: wrap; gap: 0.6rem; }
  .pv-tabs button {
    min-height: 44px; padding: 0 1.4rem; border-radius: 99px; cursor: pointer;
    border: 1px solid rgba(250, 248, 244, 0.4); background: transparent; color: #FAF8F4; font: inherit; font-size: 1.4rem;
  }
  .pv-tabs button[aria-selected="true"] { background: #E8DCC8; color: #1D3B53; border-color: #E8DCC8; }
  .pv-tabs button:focus-visible { outline: 2px solid #E8DCC8; outline-offset: 2px; }
</style>
<div class="pv-bar">
  <div class="page-width">
    <p>Section preview with placeholder data. Choose a product to see the metafields change the result.</p>
    <div class="pv-tabs" role="tablist">
      ${panels.map((p, i) => `<button type="button" role="tab" id="pv-tab-${i}" aria-selected="${i === 0}" data-panel="${i}">${p.title}</button>`).join('')}
    </div>
  </div>
</div>
${panels.map((p, i) => `<div data-pv-panel="${i}"${i === 0 ? '' : ' hidden'}>${p.html}</div>`).join('\n')}
<script>
  document.querySelectorAll('[data-panel]').forEach((btn) => btn.addEventListener('click', () => {
    document.querySelectorAll('[data-panel]').forEach((b) => b.setAttribute('aria-selected', String(b === btn)));
    document.querySelectorAll('[data-pv-panel]').forEach((el) => { el.hidden = el.dataset.pvPanel !== btn.dataset.panel; });
  }));
</script>
`;

mkdirSync(join(root, 'preview'), { recursive: true });
const out = join(root, 'preview', `${outName}.html`);
writeFileSync(out, page);
console.log('Preview written to', out);
