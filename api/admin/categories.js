const { json, readBody, requireAdmin } = require("../../lib/cms/auth");

function slug(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

module.exports = async function handler(req, res) {
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  const { supabase } = auth;
  const body = readBody(req);
  try {
    if (req.method === "GET") {
      const { data, error } = await supabase.from("categories").select("*").order("display_order");
      if (error) throw error;
      return json(res, 200, { categories: data });
    }
    if (req.method === "POST") {
      const name = String(body.name || "").trim();
      const categorySlug = slug(body.slug || name);
      if (!name || !categorySlug) return json(res, 400, { error: "A category name is required." });
      const { data, error } = await supabase.from("categories").insert({
        name, slug: categorySlug, display_order: Number(body.display_order) || 0, is_visible: body.is_visible !== false
      }).select().single();
      if (error) throw error;
      return json(res, 201, { category: data });
    }
    if (req.method === "PATCH") {
      if (!body.id) return json(res, 400, { error: "Category id is required." });
      const name = String(body.name || "").trim();
      const categorySlug = slug(body.slug || name);
      if (!name || !categorySlug) return json(res, 400, { error: "A category name is required." });
      const { data, error } = await supabase.from("categories").update({
        name, slug: categorySlug, display_order: Number(body.display_order) || 0, is_visible: body.is_visible !== false
      }).eq("id", body.id).select().single();
      if (error) throw error;
      return json(res, 200, { category: data });
    }
    if (req.method === "DELETE") {
      if (!body.id || body.confirm !== true) return json(res, 400, { error: "Explicit delete confirmation is required." });
      const { count, error: countError } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", body.id);
      if (countError) throw countError;
      if (count && !body.reassign_to) return json(res, 409, { error: "This category still has products. Reassign them before deleting the category.", productCount: count });
      if (body.reassign_to) {
        if (body.reassign_to === body.id) return json(res, 400, { error: "Choose a different category for reassignment." });
        const { error: moveError } = await supabase.from("products").update({ category_id: body.reassign_to }).eq("category_id", body.id);
        if (moveError) throw moveError;
      }
      const { error } = await supabase.from("categories").delete().eq("id", body.id);
      if (error) throw error;
      return json(res, 200, { deleted: true, reassigned: count || 0 });
    }
    return json(res, 405, { error: "Method not allowed." });
  } catch (error) {
    return json(res, 500, { error: error.message || "Unable to save category." });
  }
};
