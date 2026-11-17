const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync("assets/js/public-catalog.js", "utf8");

function baseline() {
  return {
    categories: { sarees: "Designer Sarees", ethnic: "Ethnic Wear", new: "New Arrivals" },
    products: [
      { id: "saree-1", name: "Block Print Sarees", category: "sarees", tags: [], image: "static-block" },
      { id: "ethnic-1", name: "Kotaa Sarees", category: "ethnic", tags: [], image: "static-kotaa" },
      { id: "new-1", name: "Mul Cotton Sarees", category: "new", tags: ["new"], image: "static-new" },
      { id: "exclusive-1", name: "Exclusive Banthini Sarees", category: "sarees", tags: ["exclusive"], image: "static-exclusive" }
    ]
  };
}

async function loadCatalog(catalog) {
  const initial = baseline();
  const context = {
    Promise,
    Object,
    String,
    Array,
    window: {
      ORCHIDS_CATEGORIES: initial.categories,
      ORCHIDS_PRODUCTS: initial.products,
      setTimeout: () => 0
    },
    fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve(catalog) })
  };
  vm.runInNewContext(source, context);
  await context.window.ORCHIDS_CATALOG_READY;
  return context.window;
}

test("an empty or failed catalog leaves every original product in place", async () => {
  const context = await loadCatalog({ configured: true, categories: {}, products: [] });
  assert.equal(context.ORCHIDS_PRODUCTS.length, 4);
  assert.ok(context.ORCHIDS_PRODUCTS.some((product) => product.name === "Kotaa Sarees"));
  assert.ok(context.ORCHIDS_PRODUCTS.some((product) => product.tags.includes("exclusive")));
});

test("CMS updates merge into a matching product without duplicates", async () => {
  const context = await loadCatalog({
    configured: true,
    categories: { sarees: "Designer Sarees" },
    products: [
      { id: "db-one", name: "Block Print Sarees", category: "sarees", image: "updated-block", tags: [] },
      { id: "db-duplicate", name: "Block Print Sarees", category: "sarees", image: "duplicate-block", tags: [] }
    ]
  });
  const matching = context.ORCHIDS_PRODUCTS.filter((product) => product.name === "Block Print Sarees");
  assert.equal(matching.length, 1);
  assert.equal(matching[0].id, "saree-1");
  assert.equal(matching[0].image, "updated-block");
  assert.equal(context.ORCHIDS_PRODUCTS.length, 4);
});

test("a genuinely new CMS product is added without removing the static collection", async () => {
  const context = await loadCatalog({
    configured: true,
    categories: { custom: "Custom Pieces", exclusive: "Exclusive Collection" },
    products: [{ id: "db-extra", name: "Festive Edit", category: "custom", image: "new-image", tags: ["festive"] }]
  });
  assert.equal(context.ORCHIDS_PRODUCTS.length, 5);
  assert.equal(context.ORCHIDS_CATEGORIES.custom, "Custom Pieces");
  assert.equal(context.ORCHIDS_CATEGORIES.exclusive, undefined);
});

test("an imported legacy product can be renamed without creating a second card", async () => {
  const context = await loadCatalog({
    configured: true,
    categories: { kurtis: "Premium Kurtis" },
    products: [{ id: "db-saree", legacyId: "saree-1", name: "Hand Block Sarees", category: "kurtis", image: "renamed-image", tags: ["festive"] }]
  });
  assert.equal(context.ORCHIDS_PRODUCTS.length, 4);
  const product = context.ORCHIDS_PRODUCTS.find((item) => item.id === "saree-1");
  assert.equal(product.name, "Hand Block Sarees");
  assert.equal(product.category, "kurtis");
  assert.equal(product.image, "renamed-image");
});
