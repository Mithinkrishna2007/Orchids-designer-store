/* One-time, non-destructive importer for the current data.js catalog.
   Usage (after running the SQL migration):
   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-static-catalog.cjs
*/
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { createClient } = require("@supabase/supabase-js");

const root = path.join(__dirname, "..");
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "product-images";
if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before importing.");
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "assets/js/data.js"), "utf8"), sandbox);
const products = sandbox.window.ORCHIDS_PRODUCTS || [];
const categories = sandbox.window.ORCHIDS_CATEGORIES || {};
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

function slug(value) { return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
async function upload(localPath, storagePath) {
  if (!fs.existsSync(localPath)) return null;
  const extension = path.extname(localPath).toLowerCase();
  const contentType = extension === ".png" ? "image/png" : extension === ".webp" ? "image/webp" : "image/jpeg";
  const { error } = await supabase.storage.from(bucket).upload(storagePath, fs.readFileSync(localPath), { contentType, upsert: true });
  if (error) throw error;
  return storagePath;
}

(async () => {
  const required = new Map(Object.entries(categories));
  required.set("exclusive", "Exclusive Collection");
  for (const [key, name] of required) {
    const { error } = await supabase.from("categories").upsert({ slug: key, name, display_order: [...required.keys()].indexOf(key) + 1 }, { onConflict: "slug" });
    if (error) throw error;
  }
  const { data: dbCategories, error: categoryError } = await supabase.from("categories").select("id,slug");
  if (categoryError) throw categoryError;
  const categoryBySlug = Object.fromEntries(dbCategories.map((category) => [category.slug, category.id]));
  for (let index = 0; index < products.length; index += 1) {
    const product = products[index];
    const categorySlug = product.tags?.includes("exclusive") ? "exclusive" : product.category;
    const localImages = [...new Set([product.image, ...(product.images || [])].filter(Boolean))];
    const uploaded = [];
    for (const image of localImages) {
      const localPath = path.join(root, image);
      const destination = `products/legacy/${slug(product.id)}/${path.basename(image)}`;
      const storedPath = await upload(localPath, destination);
      if (storedPath) uploaded.push(storedPath);
    }
    const record = { legacy_id: product.id, name: product.name, category_id: categoryBySlug[categorySlug], description: product.description || null, main_image_path: uploaded[0] || null, display_order: index + 1, status: "published" };
    const { data: saved, error: saveError } = await supabase.from("products").upsert(record, { onConflict: "legacy_id" }).select().single();
    if (saveError) throw saveError;
    const { error: clearError } = await supabase.from("product_images").delete().eq("product_id", saved.id);
    if (clearError) throw clearError;
    const extras = uploaded.slice(1).map((image, imageIndex) => ({ product_id: saved.id, path: image, display_order: imageIndex + 1 }));
    if (extras.length) { const { error } = await supabase.from("product_images").insert(extras); if (error) throw error; }
    console.log(`Imported ${product.name}`);
  }
  console.log(`Imported ${products.length} products without changing local files.`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
