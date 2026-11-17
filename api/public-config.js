const { publicConfig } = require("../lib/cms/supabase");

module.exports = function handler(req, res) {
  const config = publicConfig();
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=86400");
  if (!config) return res.status(503).json({ configured: false });
  return res.status(200).json({ configured: true, ...config });
};
