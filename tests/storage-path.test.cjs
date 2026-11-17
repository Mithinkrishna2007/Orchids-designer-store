const assert = require("node:assert/strict");
const test = require("node:test");
const { isProductImagePath } = require("../lib/cms/storage-path");

test("accepts safe product image storage paths", () => {
  assert.equal(isProductImagePath("products/1bf5d4a6-2e8d-4c1f/1730000000-0.webp"), true);
  assert.equal(isProductImagePath("products/legacy/kotaa-sarees/Kotaa-sarees.png"), true);
  assert.equal(isProductImagePath("products/imported/item_01/photo.JPEG"), true);
});

test("rejects unsafe, malformed, and non-image storage paths", () => {
  [
    "",
    "assets/images/photo.png",
    "products/photo.png",
    "products//folder/photo.png",
    "products/./folder/photo.png",
    "products/../folder/photo.png",
    "products/folder/../photo.png",
    "products\\folder\\photo.png",
    "products/folder/photo.png?download=1",
    "products/folder/photo.png#preview",
    "products/folder/photo.svg",
    "products/folder/photo file.png",
    "products/folder/<script>.png"
  ].forEach((path) => assert.equal(isProductImagePath(path), false, path));
});
