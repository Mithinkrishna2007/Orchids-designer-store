const { json, readBody, requireAdmin } = require("../../lib/cms/auth");

const ALLOWED_STATUS = new Set(["draft", "published", "hidden"]);
const integer = (value, fallback = 0) => Number.isInteger(Number(value)) ? Number(value) : fallback;
function cleaned(input) {
  return {
    name: String(input.name || "").trim(),
    category_id: String(input.category_id || ""),
    description: String(input.description || "").trim() || null,
    main_image_path: String(input.main_image_path || "").trim() || null,
    focal_x: Math.max(0, Math.min(100, integer(input.focal_x, 50))),
    focal_y: Math.max(0, Math.min(100, integer(input.focal_y, 50))),
    display_order: integer(input.display_order),
    status: ALLOWED_STATUS.has(input.status) ? input.status : "draft"
  };
}

async function saveImages(supabase, productId, images) {
  if (!Array.isArray(images)) return;
  const rows = images.filter((image) => image && image.path).map((image, index) => ({
    product_id: productId,
    path: String(image.path),
    alt_text: String(image.alt_text || "").trim() || null,
    focal_x: Math.max(0, Math.min(100, integer(image.focal_x, 50))),
    focal_y: Math.max(0, Math.min(100, integer(image.focal_y, 50))),
    display_order: integer(image.display_order, index)
  }));
  const { error: deleteError } = await supabase.from("product_images").delete().eq("product_id", productId);
  if (deleteError) throw deleteError;
  if (rows.length) {
    const { error } = await supabase.from("product_images").insert(rows);
    if (error) throw error;
  }
}

module.exports = async function handler(req, res) {
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  const { supabase } = auth;
  try {
    if (req.method === "GET") {
      const [products, categories, images] = await Promise.all([
        supabase.from("products").select("*").order("display_order"),
        supabase.from("categories").select("*").order("display_order"),
        supabase.from("product_images").select("*").order("display_order")
      ]);
      if (products.error || categories.error || images.error) throw products.error || categories.error || images.error;
      return json(res, 200, { products: products.data, categories: categories.data, images: images.data });
    }
    const body = readBody(req);
    if (req.method === "POST") {
      const product = cleaned(body);
      if (!product.name || !product.category_id) return json(res, 400, { error: "A product name and category are required." });
      if (product.status === "published" && !product.main_image_path) return json(res, 400, { error: "A main photograph is required before publishing." });
      const { data, error } = await supabase.from("products").insert(product).select().single();
      if (error) throw error;
      await saveImages(supabase, data.id, body.images);
      return json(res, 201, { product: data });
    }
    if (req.method === "PATCH") {
      if (!body.id) return json(res, 400, { error: "Product id is required." });
      const product = cleaned(body);
      if (!product.name || !product.category_id) return json(res, 400, { error: "A product name and category are required." });
      if (product.status === "published" && !product.main_image_path) return json(res, 400, { error: "A main photograph is required before publishing." });
      const { data, error } = await supabase.from("products").update(product).eq("id", body.id).select().single();
      if (error) throw error;
      await saveImages(supabase, data.id, body.images);
      return json(res, 200, { product: data });
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
      if (body.remove_images === true && paths.length) {
        const [mainRefs, imageRefs] = await Promise.all([
          supabase.from("products").select("main_image_path").in("main_image_path", paths),
          supabase.from("product_images").select("path").in("path", paths)
        ]);
        if (mainRefs.error || imageRefs.error) throw mainRefs.error || imageRefs.error;
        const used = new Set([...(mainRefs.data || []).map((row) => row.main_image_path), ...(imageRefs.data || []).map((row) => row.path)]);
        paths.forEach((path) => { if (!used.has(path)) orphaned.push(path); });
        if (orphaned.length) {
          const { error: storageError } = await supabase.storage.from(process.env.SUPABASE_STORAGE_BUCKET || "product-images").remove(orphaned);
          if (storageError) throw storageError;
        }
      }
      return json(res, 200, { deleted: ids.length, removedImages: orphaned.length });
    }
    return json(res, 405, { error: "Method not allowed." });
  } catch (error) {
    return json(res, 500, { error: error.message || "Unable to save products." });
  }
};
