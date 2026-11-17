const { adminClient } = require("./supabase");

function json(res, status, body) {
  res.status(status).json(body);
}

function readBody(req) {
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch (_) { return {}; }
  }
  return req.body || {};
}

async function requireAdmin(req, res) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    json(res, 401, { error: "Sign in is required." });
    return null;
  }
  try {
    const supabase = adminClient();
    const { data, error } = await supabase.auth.getUser(token);
    const allowed = (process.env.ADMIN_EMAIL || "mithinkrishnanns@gmail.com").trim().toLowerCase();
    if (error || !data.user || data.user.email?.toLowerCase() !== allowed) {
      json(res, 403, { error: "This account is not authorised to manage ORCHIDS." });
      return null;
    }
    return { supabase, user: data.user };
  } catch (error) {
    json(res, 500, { error: "The admin service is not configured yet." });
    return null;
  }
}

module.exports = { json, readBody, requireAdmin };
