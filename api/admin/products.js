const { json, readBody, requireAdmin } = require("../../lib/cms/auth");
const { isProductImagePath } = require("../../lib/cms/storage-path");

const ALLOWED_STATUS = new Set(["draft", "published", "hidden"]);
const integer = (value, fallback = 0) => Number.isInteger(Number(value)) ? Number(value) : fallback;
const TAG = /^[a-z0-9][a-z0-9-]{0,39}$/;

function tags(input) {
  const values = Array.isArray(input) ? input : String(input || "").split(",");
  return [...new Set(values.map((value) => String(value).trim().toLowerCase()).filter((value) => TAG.test(value)))].slice(0, 12);
}

function imageRows(images, mainImagePath) {
  if (!Array.isArray(images)) return [];
  const seen = new Set();
  return images.map((image, index) => {
    const path = String(image && image.path || "").trim();
    if (!isProductImagePath(path)) throw new Error("An additional image has an invalid storage path.");
    if (path === mainImagePath || seen.has(path)) throw new Error("The same image cannot be attached more than once.");
    seen.add(path);
    return {
      path,
      alt_text: String(image.alt_text || "").trim().slice(0, 200),
      focal_x: Math.max(0, Math.min(100, integer(image.focal_x, 50))),
      focal_y: Math.max(0, Math.min(100, integer(image.focal_y, 50))),
      display_order: integer(image.display_order, index)
    };
  });
}

function cleaned(input) {
  const main_image_path = String(input.main_image_path || "").trim() || null;
  if (main_image_path && !isProductImagePath(main_image_path)) throw new Error("The main image has an invalid storage path.");
  const product = {
    name: String(input.name || "").trim(),
    category_id: String(input.category_id || ""),
    description: String(input.description || "").trim() || null,
    main_image_path,
    focal_x: Math.max(0, Math.min(100, integer(input.focal_x, 50))),
    focal_y: Math.max(0, Math.min(100, integer(input.focal_y, 50))),
    display_order: integer(input.display_order),
    status: ALLOWED_STATUS.has(input.status) ? input.status : "draft",
    tags: tags(input.tags)
  };
  return { product, images: imageRows(input.images, main_image_path) };
}

async function saveProduct(supabase, id, body) {
  const { product, images } = cleaned(body);
  if (!product.name || !product.category_id) throw new Error("A product name and category are required.");
  if (product.status === "published" && !product.main_image_path) throw new Error("A main photograph is required before publishing.");
  const { data, error } = await supabase.rpc("save_orchids_product", {
    p_id: id || null,
    p_legacy_id: body.legacy_id || null,
    p_name: product.name,
    p_category_id: product.category_id,
    p_description: product.description,
    p_main_image_path: product.main_image_path,
    p_focal_x: product.focal_x,
    p_focal_y: product.focal_y,
    p_display_order: product.display_order,
    p_status: product.status,
    p_tags: product.tags,
    p_images: images
  });
  if (error) throw error;
  return { product: data, imagePaths: [product.main_image_path].concat(images.map((image) => image.path)).filter(Boolean) };
}

async function cleanupUnreferencedPaths(supabase, paths) {
  const candidates = [...new Set(paths.filter(Boolean))];
  if (!candidates.length) return { removed: 0, warning: "" };
  const [mainRefs, imageRefs] = await Promise.all([
    supabase.from("products").select("main_image_path").in("main_image_path", candidates),
    supabase.from("product_images").select("path").in("path", candidates)
  ]);
  if (mainRefs.error || imageRefs.error) return { removed: 0, warning: "Previous image cleanup could not be verified; no files were removed." };
  const referenced = new Set([...(mainRefs.data || []).map((row) => row.main_image_path), ...(imageRefs.data || []).map((row) => row.path)]);
  const orphaned = candidates.filter((path) => !referenced.has(path));
  if (!orphaned.length) return { removed: 0, warning: "" };
  const { error } = await supabase.storage.from(process.env.SUPABASE_STORAGE_BUCKET || "product-images").remove(orphaned);
  return error ? { removed: 0, warning: "The product was saved, but an unused previous upload could not be cleaned up." } : { removed: orphaned.length, warning: "" };
}

module.exports = async function handler(req, res) {
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  const { supabase } = auth;
  try {
    if (req.method === "GET") {
      const [products, categories, images] = await Promise.all([
        supabase.from("products").select("*").order("display_order").order("updated_at", { ascending: false }),
        supabase.from("categories").select("*").order("display_order"),
        supabase.from("product_images").select("*").order("display_order")
      ]);
      if (products.error || categories.error || images.error) throw products.error || categories.error || images.error;
      return json(res, 200, { products: products.data, categories: categories.data, images: images.data });
    }
    const body = readBody(req);
    if (req.method === "POST") {
      const saved = await saveProduct(supabase, null, body);
      return json(res, 201, { product: saved.product });
    }
    if (req.method === "PATCH") {
      if (!body.id) return json(res, 400, { error: "Product id is required." });
      const [previousProduct, previousImages] = await Promise.all([
        supabase.from("products").select("main_image_path").eq("id", body.id).single(),
        supabase.from("product_images").select("path").eq("product_id", body.id)
      ]);
      if (previousProduct.error || previousImages.error) throw previousProduct.error || previousImages.error;
      const saved = await saveProduct(supabase, body.id, body);
      const previousPaths = [previousProduct.data.main_image_path].concat((previousImages.data || []).map((image) => image.path));
      const retained = new Set(saved.imagePaths);
      const cleanup = await cleanupUnreferencedPaths(supabase, previousPaths.filter((path) => !retained.has(path)));
      return json(res, 200, { product: saved.product, removedImages: cleanup.removed, warning: cleanup.warning || undefined });
    }
    if (req.method === "DELETE") {
      const ids = (Array.isArray(body.ids) ? body.ids : [body.id]).filter(Boolean);
      if (!ids.length || body.confirm !== true) return json(res, 400, { error: "Explicit delete confirmation is required." });
      const { data: selected, error: selectedError } = await supabase.from("products").select("main_image_path").in("id", ids);
      if (selectedError) throw selectedError;
      const { data: additional, error: imageError } = await supabase.from("product_images").select("path").in("product_id", ids);
      if (imageError) throw imageError;
      const paths = [...new Set([...(selected || []).map((p) => p.main_image_path), ...(additional || []).map((p) => p.path)].filter(Boolean))];
      const { error } = await supabase.from("products").delete().in("id", ids);
      if (error) throw error;
      const orphaned = [];
      let cleanupWarning = "";
      if (body.remove_images === true && paths.length) {
        const [mainRefs, imageRefs] = await Promise.all([
          supabase.from("products").select("main_image_path").in("main_image_path", paths),
          supabase.from("product_images").select("path").in("path", paths)
        ]);
        if (mainRefs.error || imageRefs.error) {
          cleanupWarning = "Image references could not be verified, so storage files were kept.";
        } else {
          const used = new Set([...(mainRefs.data || []).map((row) => row.main_image_path), ...(imageRefs.data || []).map((row) => row.path)]);
          paths.forEach((path) => { if (!used.has(path)) orphaned.push(path); });
          if (orphaned.length) {
            const { error: storageError } = await supabase.storage.from(process.env.SUPABASE_STORAGE_BUCKET || "product-images").remove(orphaned);
            if (storageError) cleanupWarning = "The product was deleted, but unused storage files could not be cleaned up.";
          }
        }
      }
      return json(res, 200, { deleted: ids.length, removedImages: cleanupWarning ? 0 : orphaned.length, warning: cleanupWarning || undefined });
    }
    return json(res, 405, { error: "Method not allowed." });
  } catch (error) {
    return json(res, 500, { error: error.message || "Unable to save products." });
  }
};
