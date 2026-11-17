(function () {
  "use strict";
  const AUTHORISED_EMAIL = "mithinkrishnanns@gmail.com";
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
  const state = { client: null, config: null, session: null, products: [], categories: [], images: [], files: [], selected: new Set(), editingImages: [], editingMainPath: "", staticProducts: window.ORCHIDS_PRODUCTS || [] };

  function escapeHtml(value) { const node = document.createElement("span"); node.textContent = value || ""; return node.innerHTML; }
  function publicUrl(path) { return path ? state.client.storage.from(state.config.bucket).getPublicUrl(path).data.publicUrl : ""; }
  function toast(message, isError) { const el = $("#toast"); el.textContent = message; el.classList.add("is-visible"); el.style.background = isError ? "#9b2f2f" : "#382520"; clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("is-visible"), 4200); }
  function setMessage(selector, message) { $(selector).textContent = message || ""; }
  function authHeaders() { return { "Content-Type": "application/json", Authorization: `Bearer ${state.session.access_token}` }; }
  async function api(path, options = {}) {
    const response = await fetch(path, { ...options, headers: { ...authHeaders(), ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error(data.error || "Request failed."); error.status = response.status; error.data = data; throw error; }
    return data;
  }
  function categoryName(id) { const category = state.categories.find((item) => item.id === id); return category ? category.name : "Unassigned"; }
  function imagesFor(productId) { return state.images.filter((image) => image.product_id === productId); }
  function updateMetrics() {
    const metrics = [
      [state.products.length, "Total products"],
      [state.products.filter((product) => product.status === "published").length, "Published"],
      [state.products.filter((product) => product.status === "draft").length, "Drafts"],
      [state.categories.filter((category) => category.is_visible).length, "Visible categories"]
    ];
    $("#metrics").innerHTML = metrics.map(([number, label]) => `<article class="metric"><strong>${number}</strong><span>${label}</span></article>`).join("");
  }
  function renderProducts() {
    const term = $("#product-search").value.trim().toLowerCase();
    const productCard = (product) => {
      const image = publicUrl(product.main_image_path);
      return `<article class="admin-product"><input class="select-product" type="checkbox" data-select-product="${product.id}" ${state.selected.has(product.id) ? "checked" : ""} aria-label="Select ${escapeHtml(product.name)}"><figure>${image ? `<img src="${image}" alt="">` : ""}</figure><div class="admin-product__body"><small>${escapeHtml(categoryName(product.category_id))}</small><h3>${escapeHtml(product.name)}</h3><span class="status status--${product.status}">${product.status}</span><div class="admin-product__actions"><button type="button" data-edit-product="${product.id}">Edit</button><button type="button" data-product-status="${product.id}" data-status="${product.status === "published" ? "hidden" : "published"}">${product.status === "published" ? "Hide" : "Publish"}</button><button type="button" data-delete-product="${product.id}">Delete</button></div></div></article>`;
    };
    const groups = state.categories.map((category) => ({ category, products: state.products.filter((product) => product.category_id === category.id && product.name.toLowerCase().includes(term)) })).filter((group) => group.products.length || !term);
    $("#products-list").innerHTML = groups.length ? groups.map(({ category, products }) => `<section class="admin-collection-group" data-category="${escapeHtml(category.slug)}"><header><div><p class="admin-kicker">${category.slug === "new" || category.slug === "exclusive" ? "Priority collection" : "Collection"}</p><h2>${escapeHtml(category.name)}</h2></div><span>${products.length} product${products.length === 1 ? "" : "s"}</span></header>${products.length ? `<div class="product-admin-grid">${products.map(productCard).join("")}</div>` : `<p class="empty-collection">No products here yet. Use “Add product” to place a new product in this collection.</p>`}</section>`).join("") : "<p>No products match this search.</p>";
    $("#bulk-delete").disabled = state.selected.size === 0;
  }
  function renderCategories() {
    $("#categories-list").innerHTML = state.categories.map((category) => {
      const count = state.products.filter((product) => product.category_id === category.id).length;
      return `<div class="category-row"><div><h3>${escapeHtml(category.name)}</h3><small>/${escapeHtml(category.slug)}</small></div><small>${count} product${count === 1 ? "" : "s"}</small><small>${category.is_visible ? "Visible" : "Hidden"} · Order ${category.display_order}</small><div><button type="button" data-edit-category="${category.id}">Edit</button><button type="button" data-delete-category="${category.id}">Delete</button></div></div>`;
    }).join("");
  }
  function renderImages() {
    const rows = [];
    state.products.forEach((product) => {
      if (product.main_image_path) rows.push({ path: product.main_image_path, product: product.name, protected: true });
      imagesFor(product.id).forEach((image) => rows.push({ path: image.path, product: product.name, protected: true }));
    });
    const referenced = new Map(rows.map((row) => [row.path, row]));
    const allFiles = Array.from(new Set(state.files.concat(rows.map((row) => row.path))));
    $("#images-list").innerHTML = allFiles.length ? allFiles.map((path) => { const image = referenced.get(path); return `<article class="image-item"><img src="${publicUrl(path)}" alt=""><div><strong>${escapeHtml(image?.product || "Unused upload")}</strong><br>${escapeHtml(path)}<br>${image ? "Protected while in use" : `<button type="button" data-delete-image="${escapeHtml(path)}">Remove permanently</button>`}</div></article>`; }).join("") : "<p>No product images have been uploaded yet.</p>";
  }
  async function refresh() {
    const data = await api("/api/admin/products");
    state.products = data.products || []; state.categories = data.categories || []; state.images = data.images || [];
    const library = await api("/api/admin/images"); state.files = library.files || [];
    updateMetrics(); renderProducts(); renderCategories(); renderImages();
  }
  function catalogCategory(product) {
    return product.tags && product.tags.includes("exclusive") ? "exclusive" : product.category;
  }
  async function uploadStaticImage(path, productId, index) {
    const response = await fetch(`/${String(path).replace(/^\/+/, "")}`);
    if (!response.ok) throw new Error(`Could not read the existing image: ${path}`);
    const blob = await response.blob();
    if (!TYPES.has(blob.type) || blob.size > MAX_FILE_SIZE) throw new Error(`Existing image is unsupported or larger than 10 MB: ${path}`);
    const extension = (path.split(".").pop() || "jpg").toLowerCase();
    const destination = `products/imported/${productId}/${Date.now()}-${index}.${extension}`;
    const { error } = await state.client.storage.from(state.config.bucket).upload(destination, blob, { contentType: blob.type, upsert: false });
    if (error) throw error;
    return destination;
  }
  async function importCurrentCatalog() {
    if (!state.staticProducts.length) return toast("The local catalog was not found.", true);
    const categoryBySlug = Object.fromEntries(state.categories.map((category) => [category.slug, category.id]));
    const missing = state.staticProducts.filter((product) => {
      const categoryId = categoryBySlug[catalogCategory(product)];
      return categoryId && !state.products.some((current) => current.name === product.name && current.category_id === categoryId);
    });
    if (!missing.length) return toast("All current website products are already in the dashboard.");
    const button = $("#import-current-catalog"); button.disabled = true;
    try {
      for (let index = 0; index < missing.length; index += 1) {
        const product = missing[index];
        setMessage("#import-message", `Importing ${index + 1} of ${missing.length}: ${product.name}`);
        const imagePaths = [...new Set([product.image, ...(product.images || [])].filter(Boolean))];
        const uploaded = [];
        for (let imageIndex = 0; imageIndex < imagePaths.length; imageIndex += 1) {
          uploaded.push(await uploadStaticImage(imagePaths[imageIndex], product.id || `item-${index}`, imageIndex));
        }
        if (!uploaded[0]) throw new Error(`No valid main image was found for ${product.name}.`);
        await api("/api/admin/products", { method: "POST", body: JSON.stringify({
          name: product.name,
          category_id: categoryBySlug[catalogCategory(product)],
          description: product.description || "",
          main_image_path: uploaded[0],
          display_order: index + 1,
          status: "published",
          focal_x: 50,
          focal_y: 50,
          images: uploaded.slice(1).map((path, imageIndex) => ({ path, display_order: imageIndex + 1, focal_x: 50, focal_y: 50 }))
        }) });
      }
      setMessage("#import-message", "");
      toast(`${missing.length} current website products imported. You can now edit, delete or replace them here.`);
      await refresh();
    } catch (error) {
      setMessage("#import-message", error.message || "Import did not finish. You can safely retry; existing products will be skipped.");
    } finally { button.disabled = false; }
  }
  function selectView(name) {
    $$("[data-view]").forEach((button) => button.classList.toggle("is-active", button.dataset.view === name));
    $$("[data-panel]").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === name));
    $("#view-title").textContent = name === "images" ? "Image Library" : name[0].toUpperCase() + name.slice(1);
    $("#dashboard-view").classList.remove("menu-open");
  }
  function openProduct(product) {
    $("#product-dialog-title").textContent = product ? "Edit product" : "Add product";
    $("#product-id").value = product?.id || "";
    $("#product-name").value = product?.name || "";
    $("#product-category").innerHTML = state.categories.map((category) => `<option value="${category.id}" ${product?.category_id === category.id ? "selected" : ""}>${escapeHtml(category.name)}</option>`).join("");
    $("#product-order").value = product?.display_order ?? 0;
    $("#product-status").value = product?.status || "draft";
    $("#product-description").value = product?.description || "";
    $("#product-focal-x").value = product?.focal_x ?? 50;
    $("#product-focal-y").value = product?.focal_y ?? 50;
    $("#product-main-image").value = ""; $("#product-additional-images").value = "";
    state.editingImages = product ? imagesFor(product.id).map((image) => ({ ...image })) : [];
    state.editingMainPath = product?.main_image_path || "";
    $("#main-preview").innerHTML = state.editingMainPath ? `<img src="${publicUrl(state.editingMainPath)}" alt="Current main photograph">` : "";
    renderAdditionalPreviews(); setMessage("#product-message", ""); $("#product-dialog").showModal();
  }
  function renderAdditionalPreviews() {
    $("#additional-previews").innerHTML = state.editingImages.map((image, index) => `<span><img src="${image.preview || publicUrl(image.path)}" alt=""><button class="text-button" type="button" data-remove-additional="${index}">Remove</button></span>`).join("");
  }
  function validateFiles(files) {
    return Array.from(files || []).every((file) => TYPES.has(file.type) && file.size <= MAX_FILE_SIZE);
  }
  async function uploadFiles(files, statusSelector) {
    const uploaded = [];
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      setMessage(statusSelector, `Uploading ${index + 1} of ${files.length}: ${file.name}`);
      const extension = file.name.split(".").pop().toLowerCase();
      const path = `products/${crypto.randomUUID()}/${Date.now()}-${index}.${extension}`;
      const { error } = await state.client.storage.from(state.config.bucket).upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      uploaded.push({ path, alt_text: "", focal_x: 50, focal_y: 50, display_order: state.editingImages.length + index });
    }
    return uploaded;
  }
  async function saveProduct(event) {
    event.preventDefault();
    const mainFile = $("#product-main-image").files[0]; const additionalFiles = $("#product-additional-images").files;
    if (!validateFiles(mainFile ? [mainFile] : []) || !validateFiles(additionalFiles)) return setMessage("#product-message", "Use JPG, PNG or WebP images up to 10 MB each.");
    try {
      let mainPath = state.editingMainPath;
      if (mainFile) mainPath = (await uploadFiles([mainFile], "#product-message"))[0].path;
      const newImages = await uploadFiles(Array.from(additionalFiles), "#product-message");
      const status = $("#product-status").value;
      if (status === "published" && !mainPath) return setMessage("#product-message", "A main photograph is required before publishing.");
      const payload = { id: $("#product-id").value || undefined, name: $("#product-name").value, category_id: $("#product-category").value, display_order: Number($("#product-order").value), status, description: $("#product-description").value, main_image_path: mainPath, focal_x: Number($("#product-focal-x").value), focal_y: Number($("#product-focal-y").value), images: state.editingImages.concat(newImages) };
      await api("/api/admin/products", { method: payload.id ? "PATCH" : "POST", body: JSON.stringify(payload) });
      $("#product-dialog").close(); toast("Product saved. Published changes will appear on the website shortly."); await refresh();
    } catch (error) { setMessage("#product-message", error.message || "Could not save the product."); }
  }
  function confirm(content, actionText, onConfirm) {
    $("#confirm-content").innerHTML = content; const dialog = $("#confirm-dialog"); const action = $("#confirm-action"); action.textContent = actionText || "Confirm delete";
    action.onclick = async (event) => { event.preventDefault(); try { await onConfirm(); dialog.close(); } catch (error) { toast(error.message || "Unable to complete action.", true); } };
    dialog.showModal();
  }
  function deleteProducts(ids) {
    const items = state.products.filter((product) => ids.includes(product.id)); const first = items[0];
    confirm(`<h2>Delete ${items.length > 1 ? `${items.length} products` : "product"}?</h2>${items.length === 1 && first.main_image_path ? `<img src="${publicUrl(first.main_image_path)}" alt="">` : ""}<p>This will remove ${items.length === 1 ? `<strong>${escapeHtml(first.name)}</strong>` : "the selected products"} from the public website. This action cannot be undone.</p><label class="check"><input type="checkbox" id="delete-images"> Also permanently delete photographs that are no longer used elsewhere</label>`, "Confirm delete", async () => { const result = await api("/api/admin/products", { method: "DELETE", body: JSON.stringify({ ids, confirm: true, remove_images: $("#delete-images").checked }) }); state.selected.clear(); toast(`${result.deleted} product${result.deleted === 1 ? "" : "s"} deleted.`); await refresh(); });
  }
  function openCategory(category) {
    $("#category-dialog-title").textContent = category ? "Edit category" : "Add category";
    $("#category-id").value = category?.id || ""; $("#category-name").value = category?.name || ""; $("#category-slug").value = category?.slug || ""; $("#category-order").value = category?.display_order ?? 0; $("#category-visible").checked = category?.is_visible !== false; setMessage("#category-message", ""); $("#category-dialog").showModal();
  }
  async function saveCategory(event) { event.preventDefault(); try { const id = $("#category-id").value; await api("/api/admin/categories", { method: id ? "PATCH" : "POST", body: JSON.stringify({ id: id || undefined, name: $("#category-name").value, slug: $("#category-slug").value, display_order: Number($("#category-order").value), is_visible: $("#category-visible").checked }) }); $("#category-dialog").close(); toast("Category saved."); await refresh(); } catch (error) { setMessage("#category-message", error.message); } }
  function deleteCategory(category) {
    const count = state.products.filter((product) => product.category_id === category.id).length;
    const options = state.categories.filter((item) => item.id !== category.id).map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join("");
    const body = count ? `<h2>Reassign products first</h2><p><strong>${escapeHtml(category.name)}</strong> has ${count} product${count === 1 ? "" : "s"}. Products will never be deleted with a category. Choose where to move them before confirming.</p><label>Move products to<select id="reassign-category">${options}</select></label>` : `<h2>Delete category?</h2><p><strong>${escapeHtml(category.name)}</strong> has no products. This cannot be undone.</p>`;
    confirm(body, "Delete category", async () => { await api("/api/admin/categories", { method: "DELETE", body: JSON.stringify({ id: category.id, confirm: true, reassign_to: count ? $("#reassign-category").value : undefined }) }); toast(count ? "Category deleted and products reassigned." : "Category deleted."); await refresh(); });
  }
  async function initDashboard(session) {
    state.session = session; $("#login-view").hidden = true; $("#dashboard-view").hidden = false; $("#admin-user").textContent = session.user.email; $("#storage-bucket").textContent = state.config.bucket; await refresh();
  }
  async function boot() {
    try {
      const response = await fetch("/api/public-config"); state.config = await response.json();
      if (!response.ok || !state.config.configured) throw new Error("Supabase is not configured. Add the required Vercel environment variables first.");
      state.client = window.supabase.createClient(state.config.url, state.config.anonKey, { auth: { persistSession: true, autoRefreshToken: true } });
      const { data: { session } } = await state.client.auth.getSession();
      if (session?.user?.email?.toLowerCase() === AUTHORISED_EMAIL) await initDashboard(session);
    } catch (error) { setMessage("#login-message", error.message); }
  }
  $("#login-form").addEventListener("submit", async (event) => { event.preventDefault(); try { setMessage("#login-message", "Signing in…"); const { data, error } = await state.client.auth.signInWithPassword({ email: $("#login-email").value, password: $("#login-password").value }); if (error) throw error; if (data.user.email.toLowerCase() !== AUTHORISED_EMAIL) { await state.client.auth.signOut(); throw new Error("This account is not authorised to manage ORCHIDS."); } setMessage("#login-message", ""); await initDashboard(data.session); } catch (error) { setMessage("#login-message", error.message || "Unable to sign in."); } });
  $("#logout").addEventListener("click", async () => { await state.client.auth.signOut(); location.reload(); });
  $$("[data-view]").forEach((button) => button.addEventListener("click", () => selectView(button.dataset.view)));
  $("#sidebar-toggle").addEventListener("click", () => $("#dashboard-view").classList.toggle("menu-open"));
  $$('[data-open-product]').forEach((button) => button.addEventListener("click", () => openProduct()));
  $("#product-form").addEventListener("submit", saveProduct); $("#category-form").addEventListener("submit", saveCategory);
  $("#add-category").addEventListener("click", () => openCategory()); $("#product-search").addEventListener("input", renderProducts); $("#bulk-delete").addEventListener("click", () => deleteProducts(Array.from(state.selected))); $("#refresh-images").addEventListener("click", refresh);
  $("#import-current-catalog").addEventListener("click", () => confirm(`<h2>Import current website products?</h2><p>This copies the existing ORCHIDS collection photos and product names into Supabase once. It does not delete or change anything on the current website. After import, every product can be edited, removed or replaced from this dashboard.</p>`, "Import products", importCurrentCatalog));
  $("#product-name").addEventListener("input", () => { if (!$("#product-id").value) $("#category-slug"); });
  $("#product-main-image").addEventListener("change", (event) => { const file = event.target.files[0]; if (file) $("#main-preview").innerHTML = `<img src="${URL.createObjectURL(file)}" alt="New main preview">`; });
  $("#remove-main-image").addEventListener("click", () => { state.editingMainPath = ""; $("#product-main-image").value = ""; $("#main-preview").innerHTML = ""; setMessage("#product-message", "Main photograph removed. Add a replacement before publishing."); });
  $("#product-additional-images").addEventListener("change", (event) => { Array.from(event.target.files).forEach((file) => state.editingImages.push({ preview: URL.createObjectURL(file), pending: file, path: "" })); renderAdditionalPreviews(); });
  document.addEventListener("click", async (event) => {
    const closeDialog = event.target.closest("[data-close-dialog]")?.dataset.closeDialog; if (closeDialog) { $("#" + closeDialog).close(); return; }
    const productId = event.target.closest("[data-edit-product]")?.dataset.editProduct; if (productId) return openProduct(state.products.find((product) => product.id === productId));
    const statusButton = event.target.closest("[data-product-status]"); if (statusButton) { const product = state.products.find((item) => item.id === statusButton.dataset.productStatus); try { await api("/api/admin/products", { method: "PATCH", body: JSON.stringify({ ...product, status: statusButton.dataset.status, images: imagesFor(product.id) }) }); toast(`Product ${statusButton.dataset.status}.`); await refresh(); } catch (error) { toast(error.message, true); } return; }
    const deleteId = event.target.closest("[data-delete-product]")?.dataset.deleteProduct; if (deleteId) return deleteProducts([deleteId]);
    const select = event.target.closest("[data-select-product]"); if (select) { select.checked ? state.selected.add(select.dataset.selectProduct) : state.selected.delete(select.dataset.selectProduct); $("#bulk-delete").disabled = state.selected.size === 0; return; }
    const categoryId = event.target.closest("[data-edit-category]")?.dataset.editCategory; if (categoryId) return openCategory(state.categories.find((category) => category.id === categoryId));
    const deleteCategoryId = event.target.closest("[data-delete-category]")?.dataset.deleteCategory; if (deleteCategoryId) return deleteCategory(state.categories.find((category) => category.id === deleteCategoryId));
    const removeIndex = event.target.closest("[data-remove-additional]")?.dataset.removeAdditional; if (removeIndex !== undefined) { state.editingImages.splice(Number(removeIndex), 1); renderAdditionalPreviews(); return; }
    const imagePath = event.target.closest("[data-delete-image]")?.dataset.deleteImage; if (imagePath) confirm(`<h2>Remove image permanently?</h2><p>This photograph is protected while any product uses it. Remove it from the product first, then confirm permanent deletion.</p>`, "Delete image", async () => { await api("/api/admin/images", { method: "DELETE", body: JSON.stringify({ path: imagePath, confirm: true }) }); toast("Image permanently deleted."); await refresh(); });
  });
  boot();
})();
