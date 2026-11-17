/* Read-only local audit for the standalone public website. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const pages = ["index.html", "about.html", "collections.html", "services.html", "gallery.html", "contact.html"];
const errors = [];
const fileExists = (relative) => fs.existsSync(path.join(root, relative));
const localReference = (value) => value && !value.startsWith("#") && !/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(value);

for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), "utf8");
  if (/supabase|public-catalog|\/api\/admin|assets\/js\/admin/i.test(html)) errors.push(`${page}: contains a removed CMS reference`);
  for (const match of html.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)) {
    const reference = match[1].split(/[?#]/, 1)[0];
    if (!localReference(reference)) continue;
    const target = reference.startsWith("/") ? reference.slice(1) : reference;
    if (!fileExists(target)) errors.push(`${page}: missing local reference ${reference}`);
  }
}

const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "assets/js/data.js"), "utf8"), sandbox);
const catalog = [...(sandbox.window.ORCHIDS_PRODUCTS || []), ...(sandbox.window.ORCHIDS_GALLERY || [])];
for (const item of catalog) {
  for (const image of [item.image].concat(item.images || []).filter(Boolean)) {
    if (!fileExists(image)) errors.push(`catalog: missing image ${image}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Public audit passed: ${pages.length} pages and ${catalog.length} catalogue/gallery entries checked.`);
}
