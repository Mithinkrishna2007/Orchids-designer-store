const IMAGE_EXTENSION = /\.(?:jpe?g|png|webp)$/i;
const SAFE_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function isProductImagePath(value) {
  if (typeof value !== "string" || !value || value.includes("\\") || /[?#]/.test(value)) return false;
  const parts = value.split("/");
  if (parts.length < 3 || parts[0] !== "products") return false;
  if (parts.some((part) => !part || part === "." || part === ".." || !SAFE_SEGMENT.test(part))) return false;
  return IMAGE_EXTENSION.test(parts[parts.length - 1]);
}

module.exports = { isProductImagePath };
