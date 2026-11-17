const { json, readBody, requireAdmin } = require("../../lib/cms/auth");

module.exports = async function handler(req, res) {
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  const { supabase } = auth;
  const body = readBody(req);
  try {
    if (req.method === "GET") {
      const [products, images] = await Promise.all([
        supabase.from("products").select("id,name,main_image_path,created_at"),
        supabase.from("product_images").select("id,product_id,path,alt_text,created_at")
      ]);
      if (products.error || images.error) throw products.error || images.error;
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || "product-images";
      async function listFolder(prefix) {
        const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000, sortBy: { column: "name", order: "asc" } });
        if (error) throw error;
        const files = [];
        for (const item of data || []) {
          const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
          if (item.id) files.push(itemPath);
          else files.push(...await listFolder(itemPath));
        }
        return files;
      }
      return json(res, 200, { products: products.data, images: images.data, files: await listFolder("") });
    }
    if (req.method === "DELETE") {
      const path = String(body.path || "");
      if (!path || body.confirm !== true) return json(res, 400, { error: "An image path and explicit confirmation are required." });
      const [mainRefs, additionalRefs] = await Promise.all([
        supabase.from("products").select("id").eq("main_image_path", path),
        supabase.from("product_images").select("id").eq("path", path)
      ]);
      if (mainRefs.error || additionalRefs.error) throw mainRefs.error || additionalRefs.error;
      if ((mainRefs.data || []).length || (additionalRefs.data || []).length) {
        return json(res, 409, { error: "This image is still attached to a product and cannot be deleted." });
      }
      const { error } = await supabase.storage.from(process.env.SUPABASE_STORAGE_BUCKET || "product-images").remove([path]);
      if (error) throw error;
      return json(res, 200, { deleted: true });
    }
    return json(res, 405, { error: "Method not allowed." });
  } catch (error) {
    return json(res, 500, { error: error.message || "Unable to manage image." });
  }
};
