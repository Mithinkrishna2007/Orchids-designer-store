"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const STATES = Object.freeze({
  NEW_CUSTOMER: "NEW_CUSTOMER",
  MAIN_MENU: "MAIN_MENU",
  PRODUCT_ENQUIRY: "PRODUCT_ENQUIRY",
  COLLECTION_BROWSING: "COLLECTION_BROWSING",
  CUSTOM_STITCHING: "CUSTOM_STITCHING",
  HUMAN_HANDOVER: "HUMAN_HANDOVER",
  HUMAN_ACTIVE: "HUMAN_ACTIVE",
  RESOLVED: "RESOLVED"
});

const MENU = Object.freeze({
  PRODUCT: "MAIN_PRODUCT",
  COLLECTIONS: "MAIN_COLLECTIONS",
  STITCHING: "MAIN_STITCHING",
  TEAM: "MAIN_TEAM",
  SAREES: "COLLECTION_SAREES",
  KURTIS: "COLLECTION_KURTIS",
  ETHNIC: "COLLECTION_ETHNIC",
  NEW: "COLLECTION_NEW",
  SPECIFIC: "PRODUCT_SPECIFIC",
  MAIN: "MAIN_MENU"
});

const ADDRESS = "Opposite Ashram School & ICICI Bank,\nKK Nagar, Sundakkamuthur,\nCoimbatore, Tamil Nadu – 641010.";

function loadEnvFile(filePath = path.resolve(process.cwd(), ".env")) {
  try {
    for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!match || match[2].startsWith("#") || process.env[match[1]] !== undefined) continue;
      process.env[match[1]] = match[2].replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, "$1$2");
    }
  } catch (error) { if (error.code !== "ENOENT") throw error; }
}

function configFromEnv(env = process.env) {
  return {
    accessToken: env.WHATSAPP_ACCESS_TOKEN || "",
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID || "",
    verifyToken: env.WHATSAPP_VERIFY_TOKEN || "",
    appSecret: env.WHATSAPP_APP_SECRET || "",
    websiteUrl: (env.ORCHIDS_WEBSITE_URL || "").replace(/\/$/, ""),
    mapsUrl: env.ORCHIDS_MAPS_URL || "",
    adminToken: env.HANDOVER_ADMIN_TOKEN || "",
    notificationWebhook: env.HANDOVER_NOTIFICATION_WEBHOOK || "",
    storePath: path.resolve(process.cwd(), env.CONVERSATION_STORE_PATH || "./data/conversations.json")
  };
}

class ConversationStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = { conversations: {}, processedMessageIds: {} };
    this.load();
  }
  load() {
    try { this.data = JSON.parse(fs.readFileSync(this.filePath, "utf8")); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  save() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const temporary = this.filePath + ".tmp";
    const serialized = JSON.stringify(this.data, null, 2);
    fs.writeFileSync(temporary, serialized, "utf8");
    try { fs.renameSync(temporary, this.filePath); }
    catch (error) {
      // Windows can briefly lock a destination file during a rename. Preserve
      // the state with a direct write rather than dropping a customer message.
      if (error.code !== "EPERM") throw error;
      fs.writeFileSync(this.filePath, serialized, "utf8");
      fs.rmSync(temporary, { force: true });
    }
  }
  get(phone) {
    if (!this.data.conversations[phone]) {
      this.data.conversations[phone] = { phone, state: STATES.NEW_CUSTOMER, history: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    }
    return this.data.conversations[phone];
  }
  update(phone, patch) {
    const conversation = this.get(phone);
    Object.assign(conversation, patch, { updatedAt: new Date().toISOString() });
    this.save();
    return conversation;
  }
  append(phone, entry) {
    const conversation = this.get(phone);
    conversation.history.push({ ...entry, at: new Date().toISOString() });
    conversation.history = conversation.history.slice(-100);
    conversation.updatedAt = new Date().toISOString();
    this.save();
  }
  alreadyProcessed(messageId) { return Boolean(messageId && this.data.processedMessageIds[messageId]); }
  markProcessed(messageId) {
    if (!messageId) return;
    this.data.processedMessageIds[messageId] = Date.now();
    const ids = Object.keys(this.data.processedMessageIds);
    if (ids.length > 2000) ids.sort((a, b) => this.data.processedMessageIds[a] - this.data.processedMessageIds[b]).slice(0, ids.length - 2000).forEach((id) => delete this.data.processedMessageIds[id]);
    this.save();
  }
}

function collectionUrl(config, anchor) {
  return config.websiteUrl ? `${config.websiteUrl}/collections.html#${anchor}` : "";
}

function textBody(message) {
  return message?.text?.body || message?.interactive?.button_reply?.id || message?.interactive?.list_reply?.id || "";
}

function normalize(value) { return String(value || "").trim().toLowerCase(); }

function detectIntent(raw) {
  const text = normalize(raw);
  // Interactive reply IDs are authoritative; do not reinterpret their words.
  if (Object.values(MENU).map(normalize).includes(text)) return text.toUpperCase();
  if (/saree|sari/.test(text)) return MENU.SAREES;
  if (/kurti/.test(text)) return MENU.KURTIS;
  if (/ethnic|lehenga|anarkali|sharara/.test(text)) return MENU.ETHNIC;
  if (["1", MENU.PRODUCT.toLowerCase()].includes(text) || /product|price|outfit/.test(text)) return MENU.PRODUCT;
  if (["2", MENU.COLLECTIONS.toLowerCase()].includes(text) || /collection|show me|browse|new arrival/.test(text)) return MENU.COLLECTIONS;
  if (["3", MENU.STITCHING.toLowerCase()].includes(text) || /stitch|pattern|design|reference|tailor/.test(text)) return MENU.STITCHING;
  if (["4", MENU.TEAM.toLowerCase()].includes(text) || /owner|human|person|team|call|talk/.test(text)) return MENU.TEAM;
  if (/location|address|visit|shop|store/.test(text)) return "LOCATION";
  if (/^(hi|hello|hey|menu|start)$/.test(text)) return "GREETING";
  return "UNKNOWN";
}

function makeText(to, body) { return { messaging_product: "whatsapp", to, type: "text", text: { preview_url: false, body } }; }

function makeList(to, body, button, sections) {
  return { messaging_product: "whatsapp", to, type: "interactive", interactive: { type: "list", body: { text: body }, action: { button, sections } } };
}

function mainMenu(to) {
  return makeList(to,
    "Hello! Welcome to ORCHIDS Designer Store 🌸\n\nThank you for contacting us!\n\nWe offer premium designer sarees, elegant kurtis, ethnic wear, and personalized stitching services.\n\nHow may we assist you today?",
    "View options",
    [{ title: "How may we help?", rows: [
      { id: MENU.PRODUCT, title: "Product Enquiry", description: "Ask about a product or design" },
      { id: MENU.COLLECTIONS, title: "Explore Collections", description: "Sarees, kurtis and ethnic wear" },
      { id: MENU.STITCHING, title: "Custom Stitching", description: "Share a pattern or design reference" },
      { id: MENU.TEAM, title: "Speak with Our Team", description: "Personal assistance from ORCHIDS" }
    ] }]);
}

function productMenu(to) {
  return makeList(to,
    "Wonderful! We'd be happy to help you with our collections.\n\nAre you enquiring about a particular product?",
    "Choose a category",
    [{ title: "Product enquiry", rows: [
      { id: MENU.SAREES, title: "Designer Sarees" }, { id: MENU.KURTIS, title: "Premium Kurtis" },
      { id: MENU.ETHNIC, title: "Ethnic Wear" }, { id: MENU.SPECIFIC, title: "A Specific Product" },
      { id: MENU.MAIN, title: "Main Menu" }
    ] }]);
}

function collectionMenu(to) {
  return makeList(to,
    "Discover the ORCHIDS collection! 🌸\n\nChoose the collection you'd like to explore.",
    "Explore collections",
    [{ title: "Collections", rows: [
      { id: MENU.SAREES, title: "Designer Sarees" }, { id: MENU.KURTIS, title: "Premium Kurtis" },
      { id: MENU.ETHNIC, title: "Ethnic Wear" }, { id: MENU.NEW, title: "New Arrivals" },
      { id: MENU.MAIN, title: "Main Menu" }
    ] }]);
}

function collectionReply(to, config, category) {
  const messages = {
    [MENU.SAREES]: ["Explore our elegant designer saree collections at ORCHIDS.", "sarees", "Is there a particular saree you'd like to enquire about?"],
    [MENU.KURTIS]: ["Discover our premium kurti collections, thoughtfully selected for elegant everyday and special-occasion styling.", "kurtis", "Would you like to enquire about a particular design?"],
    [MENU.ETHNIC]: ["Explore our ethnic wear collections at ORCHIDS.", "ethnic", "Would you like assistance with a particular outfit?"],
    [MENU.NEW]: ["Discover the latest ORCHIDS arrivals.", "new", "Would you like to know more about any particular design?"]
  };
  const [intro, anchor, question] = messages[category];
  const link = collectionUrl(config, anchor);
  return makeText(to, `${intro}\n\n${link ? `Explore here:\n${link}\n\n` : ""}${question}`);
}

function verifySignature(secret, rawBody, signature) {
  if (!secret || !signature) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const actual = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  return actual.length === wanted.length && crypto.timingSafeEqual(actual, wanted);
}

class WhatsAppClient {
  constructor(config, fetchImpl = global.fetch) { this.config = config; this.fetch = fetchImpl; }
  configured() { return Boolean(this.config.accessToken && this.config.phoneNumberId); }
  async send(payload) {
    if (!this.configured()) { console.warn("WhatsApp send skipped: API credentials are not configured."); return { skipped: true }; }
    const response = await this.fetch(`https://graph.facebook.com/v20.0/${this.config.phoneNumberId}/messages`, {
      method: "POST", headers: { Authorization: `Bearer ${this.config.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`WhatsApp API error ${response.status}: ${await response.text()}`);
    return response.json();
  }
}

async function notifyHandover(config, conversation) {
  const event = { event: "orchids.whatsapp.handover", phone: conversation.phone, category: conversation.category, reason: conversation.handoverReason, timestamp: conversation.handoverAt };
  console.info(JSON.stringify(event));
  if (!config.notificationWebhook) return;
  try { await fetch(config.notificationWebhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(event) }); }
  catch (error) { console.error("Handover notification failed:", error.message); }
}

async function sendAndRecord(client, store, phone, payload) {
  await client.send(payload);
  store.append(phone, { direction: "outbound", type: payload.type, body: payload.text?.body || payload.interactive?.body?.text || "" });
}

async function handover(client, store, config, phone, reason) {
  const conversation = store.update(phone, { state: STATES.HUMAN_HANDOVER, category: reason === "custom_stitching" ? "Custom Stitching" : "Boutique Team", handoverReason: reason, handoverAt: new Date().toISOString(), requiresHumanAttention: true });
  if (reason === "custom_stitching") {
    await sendAndRecord(client, store, phone, makeText(phone, "Have a design in mind? We'd love to hear about it! 🧵\n\nAt ORCHIDS, you can share a reference photograph or outfit pattern that inspires you.\n\nYou can upload your preferred design here, and our boutique team will personally discuss your stitching requirements."));
    await sendAndRecord(client, store, phone, makeText(phone, "Please share your reference photograph or design with us.\n\nOur team will take over the conversation and assist you personally."));
  } else {
    await sendAndRecord(client, store, phone, makeText(phone, "Certainly! Our boutique team will assist you personally.\n\nPlease wait while we arrange for someone from ORCHIDS to continue the conversation.\n\nThank you for choosing ORCHIDS! 🌸"));
  }
  await notifyHandover(config, conversation);
}

async function processIncomingMessage({ message, contactName }, { store, client, config }) {
  const phone = message.from;
  if (!phone || store.alreadyProcessed(message.id)) return;
  store.markProcessed(message.id);
  const incoming = textBody(message);
  const conversation = store.get(phone);
  store.append(phone, { direction: "inbound", type: message.type, body: incoming || "[non-text message]", contactName: contactName || "" });

  if (conversation.state === STATES.HUMAN_HANDOVER || conversation.state === STATES.HUMAN_ACTIVE) {
    console.info(`Automation paused for ${phone}; incoming message recorded only.`);
    return;
  }

  const intent = detectIntent(incoming);
  const productMatch = String(incoming || "").match(/interested in (?:the )?(.+?)(?:\.\s|\.$|$)/i);
  if (intent === "LOCATION") {
    const map = config.mapsUrl ? `\n\nGoogle Maps: ${config.mapsUrl}` : "";
    await sendAndRecord(client, store, phone, makeText(phone, `You're welcome to visit ORCHIDS Designer Store!\n\nOur address:\n\n${ADDRESS}${map}`));
    return;
  }
  if (productMatch && productMatch[1].length > 2) {
    const productName = productMatch[1].replace(/could you please share more details/i, "").trim();
    store.update(phone, { state: STATES.PRODUCT_ENQUIRY, category: "Specific Product", productContext: productName });
    await sendAndRecord(client, store, phone, makeText(phone, `Thank you for your interest in ${productName}. Our boutique team will be happy to assist you with product details and availability.`));
    return;
  }
  if (/price|cost|rate/.test(normalize(incoming))) {
    await sendAndRecord(client, store, phone, makeText(phone, "Our team will be happy to assist you with product details and pricing. Could you please share the product or design you're interested in?"));
    return;
  }
  if (intent === MENU.STITCHING || incoming === MENU.STITCHING) return handover(client, store, config, phone, "custom_stitching");
  if (intent === MENU.TEAM || incoming === MENU.TEAM) return handover(client, store, config, phone, "boutique_team");
  if (intent === MENU.PRODUCT || incoming === MENU.PRODUCT) {
    store.update(phone, { state: STATES.PRODUCT_ENQUIRY, category: "Product Enquiry" });
    await sendAndRecord(client, store, phone, productMenu(phone));
    return;
  }
  if (intent === MENU.COLLECTIONS || incoming === MENU.COLLECTIONS) {
    store.update(phone, { state: STATES.COLLECTION_BROWSING, category: "Collections" });
    await sendAndRecord(client, store, phone, collectionMenu(phone));
    return;
  }
  const selectedCollection = [MENU.SAREES, MENU.KURTIS, MENU.ETHNIC, MENU.NEW].includes(incoming) ? incoming : intent;
  if ([MENU.SAREES, MENU.KURTIS, MENU.ETHNIC, MENU.NEW].includes(selectedCollection)) {
    store.update(phone, { state: STATES.PRODUCT_ENQUIRY, category: selectedCollection });
    await sendAndRecord(client, store, phone, collectionReply(phone, config, selectedCollection));
    return;
  }
  if (incoming === MENU.SPECIFIC || /specific product|interested in the/i.test(incoming)) {
    store.update(phone, { state: STATES.PRODUCT_ENQUIRY, category: "Specific Product" });
    await sendAndRecord(client, store, phone, makeText(phone, "Please share the product name or the photograph of the design you are interested in. Our team will be happy to assist you."));
    return;
  }
  if (conversation.state === STATES.NEW_CUSTOMER || intent === "GREETING" || incoming === MENU.MAIN || incoming === "5") {
    store.update(phone, { state: STATES.MAIN_MENU });
    await sendAndRecord(client, store, phone, mainMenu(phone));
    return;
  }
  await sendAndRecord(client, store, phone, makeText(phone, "I'm sorry, I couldn't understand that completely. Would you like to explore our collections or speak with our boutique team?"));
}

function parseWebhookMessages(payload) {
  const result = [];
  for (const entry of payload.entry || []) for (const change of entry.changes || []) {
    const value = change.value || {};
    const contactName = value.contacts?.[0]?.profile?.name || "";
    for (const message of value.messages || []) result.push({ message, contactName });
  }
  return result;
}

function json(response, status, body) { response.writeHead(status, { "Content-Type": "application/json" }); response.end(JSON.stringify(body)); }

function createServer(overrides = {}) {
  const config = overrides.config || configFromEnv();
  const store = overrides.store || new ConversationStore(config.storePath);
  const client = overrides.client || new WhatsAppClient(config, overrides.fetchImpl);
  return http.createServer(async (request, response) => {
    const url = new URL(request.url, "http://localhost");
    if (request.method === "GET" && url.pathname === "/health") return json(response, 200, { ok: true, whatsappConfigured: client.configured(), websiteConfigured: Boolean(config.websiteUrl), store: "file" });
    if (request.method === "GET" && url.pathname === "/webhook") {
      if (url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === config.verifyToken) { response.writeHead(200, { "Content-Type": "text/plain" }); return response.end(url.searchParams.get("hub.challenge") || ""); }
      return json(response, 403, { error: "Webhook verification failed" });
    }
    if (request.method === "POST" && url.pathname === "/webhook") {
      const chunks = []; for await (const chunk of request) chunks.push(chunk); const raw = Buffer.concat(chunks);
      if (!verifySignature(config.appSecret, raw, request.headers["x-hub-signature-256"])) return json(response, 401, { error: "Invalid webhook signature" });
      let payload; try { payload = JSON.parse(raw.toString("utf8")); } catch { return json(response, 400, { error: "Invalid JSON" }); }
      json(response, 200, { received: true });
      for (const incoming of parseWebhookMessages(payload)) processIncomingMessage(incoming, { store, client, config }).catch((error) => console.error("Message processing error:", error.message));
      return;
    }
    const resume = url.pathname.match(/^\/admin\/conversations\/([0-9]+)\/resume$/);
    if (request.method === "POST" && resume) {
      if (!config.adminToken || request.headers.authorization !== `Bearer ${config.adminToken}`) return json(response, 401, { error: "Unauthorized" });
      const conversation = store.update(resume[1], { state: STATES.MAIN_MENU, requiresHumanAttention: false, resumedAt: new Date().toISOString(), handoverReason: null });
      return json(response, 200, { ok: true, phone: conversation.phone, state: conversation.state });
    }
    return json(response, 404, { error: "Not found" });
  });
}

if (require.main === module) {
  loadEnvFile();
  const config = configFromEnv();
  const server = createServer({ config });
  server.listen(Number(process.env.PORT || 3000), () => console.log(`ORCHIDS WhatsApp assistant listening on port ${process.env.PORT || 3000}`));
}

module.exports = { STATES, MENU, ConversationStore, WhatsAppClient, configFromEnv, createServer, detectIntent, processIncomingMessage, verifySignature, mainMenu, productMenu, collectionMenu, collectionReply, loadEnvFile };
