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
