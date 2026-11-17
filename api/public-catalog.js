const { adminClient } = require("../lib/cms/supabase");

function imageUrl(supabase, bucket, path) {
  return path ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl : "";
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "public, s-maxage=45, stale-while-revalidate=300");
  try {
    const supabase = adminClient();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "product-images";
    const [{ data: categories, error: categoryError }, { data: products, error: productError }, { data: images, error: imageError }] = await Promise.all([
      supabase.from("categories").select("id,slug,name,display_order").eq("is_visible", true).order("display_order"),
      supabase.from("products").select("id,legacy_id,name,description,display_order,main_image_path,focal_x,focal_y,category_id,tags").eq("status", "published").order("display_order"),
      supabase.from("product_images").select("product_id,path,alt_text,display_order,focal_x,focal_y").order("display_order")
    ]);
    if (categoryError || productError || imageError) throw categoryError || productError || imageError;
    const categoriesById = Object.fromEntries((categories || []).map((c) => [c.id, c]));
    const categoryMap = Object.fromEntries((categories || []).map((c) => [c.slug, c.name]));
    const imagesByProduct = (images || []).reduce((all, image) => {
      (all[image.product_id] ||= []).push(image);
      return all;
    }, {});
    const items = (products || []).filter((product) => categoriesById[product.category_id]).map((product) => {
      const extra = imagesByProduct[product.id] || [];
      const main = imageUrl(supabase, bucket, product.main_image_path);
      return {
        id: product.id,
        legacyId: product.legacy_id || "",
        name: product.name,
        category: categoriesById[product.category_id].slug,
        description: product.description || "",
        details: [],
        image: main,
        images: [main].concat(extra.map((image) => imageUrl(supabase, bucket, image.path))).filter(Boolean),
        focalPosition: `${product.focal_x || 50}% ${product.focal_y || 50}%`,
        tone: "ivory",
        tags: product.tags || []
      };
    });
    return res.status(200).json({ configured: true, categories: categoryMap, products: items });
  } catch (error) {
    return res.status(503).json({ configured: false, error: "Catalog is temporarily unavailable." });
  }
};
