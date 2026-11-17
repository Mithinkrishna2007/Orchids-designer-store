/* Live public catalog.
   The checked-in ORCHIDS catalogue is always the protected baseline.  A
   partially populated CMS must never replace it: that would make existing
   collections, cards and boutique photographs disappear for visitors. */
(function () {
  var baselineCategories = Object.assign({}, window.ORCHIDS_CATEGORIES || {});
  var baselineProducts = (window.ORCHIDS_PRODUCTS || []).slice();
  var virtualCategories = { exclusive: true };

  function catalogCategory(product) {
    return product && product.tags && product.tags.indexOf("exclusive") !== -1 ? "exclusive" : product.category;
  }

  function identity(product) {
    return String(catalogCategory(product) || "") + "::" + String(product.name || "").trim().toLowerCase();
  }

  function normaliseRemoteProduct(product) {
    var item = Object.assign({}, product);
    item.tags = Array.isArray(item.tags) ? item.tags.slice() : [];
    if (item.category === "exclusive") {
      /* Exclusive is a curated view of the existing saree collection, not a
         separate card layout. Keep its original category and tag it instead. */
      item.category = "sarees";
      if (item.tags.indexOf("exclusive") === -1) item.tags.push("exclusive");
    }
    if (item.category === "new" && item.tags.indexOf("new") === -1) item.tags.push("new");
    return item;
  }

  function applyCatalog(catalog) {
    if (!catalog || !catalog.configured || !Array.isArray(catalog.products)) return;

    var uniqueRemote = [];
    var remoteByIdentity = {};
    var remoteByLegacyId = {};
    catalog.products.forEach(function (product) {
      if (!product || !product.name || !product.image) return;
      var key = identity(product);
      if (remoteByIdentity[key]) return;
      var normalised = normaliseRemoteProduct(product);
      remoteByIdentity[key] = normalised;
      if (normalised.legacyId) remoteByLegacyId[normalised.legacyId] = normalised;
      uniqueRemote.push(normalised);
    });

    /* An edit to an existing product may update its photograph/details. A
       missing CMS row never removes the original public product. */
    var merged = baselineProducts.map(function (product) {
      var update = remoteByLegacyId[product.id] || remoteByIdentity[identity(product)];
      if (!update) return product;
      return Object.assign({}, product, update, {
        id: product.id,
        category: update.category || product.category,
        tags: update.tags && update.tags.length ? update.tags : (product.tags || [])
      });
    });
    var baselineIds = {};
    baselineProducts.forEach(function (product) { baselineIds[identity(product)] = true; baselineIds[product.id] = true; });
    uniqueRemote.forEach(function (product) {
      if (!baselineIds[identity(product)] && !baselineIds[product.legacyId]) merged.push(product);
    });

    var categories = Object.assign({}, baselineCategories);
    Object.keys(catalog.categories || {}).forEach(function (key) {
      if (!categories[key] && !virtualCategories[key]) categories[key] = catalog.categories[key];
    });
    window.ORCHIDS_CATEGORIES = categories;
    window.ORCHIDS_PRODUCTS = merged;
  }

  var request = fetch("/api/public-catalog", { headers: { Accept: "application/json" } })
    .then(function (response) { return response.ok ? response.json() : null; })
    .catch(function () { return null; });
  var timeout = new Promise(function (resolve) { window.setTimeout(function () { resolve(null); }, 1800); });

  window.ORCHIDS_CATALOG_READY = Promise.race([request, timeout]).then(applyCatalog);
})();
