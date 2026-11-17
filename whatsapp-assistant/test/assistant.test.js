"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { ConversationStore, STATES, processIncomingMessage } = require("../server");

function harness() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "orchids-wa-"));
  const store = new ConversationStore(path.join(directory, "conversations.json"));
  const sent = [];
  const client = { send: async (payload) => { sent.push(payload); return { ok: true }; } };
  const config = { websiteUrl: "https://orchids.example", mapsUrl: "https://maps.example", notificationWebhook: "" };
  let count = 0;
  const message = (body, type = "text", phone = "919900000001") => ({ message: type === "text" ? { id: `m-${++count}`, from: phone, type, text: { body } } : { id: `m-${++count}`, from: phone, type }, contactName: "Test Customer" });
  return { store, sent, client, config, message };
}

test("greets a new customer with the main menu", async () => {
  const h = harness();
  await processIncomingMessage(h.message("Hi"), h);
  assert.equal(h.sent.length, 1);
  assert.equal(h.sent[0].type, "interactive");
  assert.match(h.sent[0].interactive.body.text, /Welcome to ORCHIDS/);
  assert.equal(h.store.get("919900000001").state, STATES.MAIN_MENU);
});

test("opens product flow and returns the saree link", async () => {
  const h = harness();
  await processIncomingMessage(h.message("Hi"), h);
  await processIncomingMessage(h.message("MAIN_PRODUCT"), h);
  await processIncomingMessage(h.message("COLLECTION_SAREES"), h);
  assert.equal(h.sent[1].type, "interactive");
  assert.match(h.sent[2].text.body, /collections.html#sarees/);
});

test("records product context from a website prefilled message", async () => {
  const h = harness();
  await processIncomingMessage(h.message("Hello ORCHIDS! I'm interested in the Ivory Organza Floral Saree. Could you please share more details?"), h);
  const conversation = h.store.get("919900000001");
  assert.equal(conversation.productContext, "Ivory Organza Floral Saree");
  assert.match(h.sent[0].text.body, /Ivory Organza Floral Saree/);
});

test("hands custom stitching to a human and never answers afterward", async () => {
  const h = harness();
  await processIncomingMessage(h.message("Hi"), h);
  await processIncomingMessage(h.message("MAIN_STITCHING"), h);
  assert.equal(h.store.get("919900000001").state, STATES.HUMAN_HANDOVER);
  assert.equal(h.sent.length, 3);
  await processIncomingMessage(h.message("[photo]", "image"), h);
  assert.equal(h.sent.length, 3);
});

test("returns the approved location response", async () => {
  const h = harness();
  await processIncomingMessage(h.message("Where is your shop?"), h);
  assert.match(h.sent[0].text.body, /KK Nagar, Sundakkamuthur/);
  assert.match(h.sent[0].text.body, /https:\/\/maps.example/);
});

test("keeps simultaneous customer states separate", async () => {
  const h = harness();
  await processIncomingMessage(h.message("Hi", "text", "919900000001"), h);
  await processIncomingMessage(h.message("I want to stitch a dress", "text", "919900000002"), h);
  assert.equal(h.store.get("919900000001").state, STATES.MAIN_MENU);
  assert.equal(h.store.get("919900000002").state, STATES.HUMAN_HANDOVER);
});

test("uses WhatsApp-compatible interactive row title lengths", async () => {
  const h = harness();
  await processIncomingMessage(h.message("Hi"), h);
  for (const row of h.sent[0].interactive.action.sections.flatMap((section) => section.rows)) assert.ok(row.title.length <= 24);
});

test("routes a direct kurti request to the matching collection", async () => {
  const h = harness();
  await processIncomingMessage(h.message("Do you have kurtis?"), h);
  assert.match(h.sent[0].text.body, /collections.html#kurtis/);
});
