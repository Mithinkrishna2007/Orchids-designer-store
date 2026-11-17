/* Live public catalog. Existing data.js remains the fallback if Supabase is unavailable. */
(function () {
  window.ORCHIDS_CATALOG_READY = fetch("/api/public-catalog", { headers: { Accept: "application/json" } })
    .then(function (response) { return response.ok ? response.json() : null; })
    .then(function (catalog) {
      if (!catalog || !catalog.configured || !Array.isArray(catalog.products) || !catalog.products.length) return;
      window.ORCHIDS_CATEGORIES = catalog.categories || window.ORCHIDS_CATEGORIES;
      window.ORCHIDS_PRODUCTS = catalog.products;
    })
    .catch(function () {
      /* The existing local collection data deliberately stays visible offline. */
    });
})();
