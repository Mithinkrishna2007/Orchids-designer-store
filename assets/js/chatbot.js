/* ========================================================================
   ORCHIDS — Website assistant engine + interface
   A local, predefined rule-based assistant. It intentionally contains no AI.
   ======================================================================== */
(function () {
  "use strict";

  var data = window.ORCHIDS_CHATBOT_DATA;
  if (!data) return;

  var business = data.business;
  var state = { open: false, context: "main", welcomed: false, lastFocus: null };
  var els = {};

  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" aria-hidden="true"><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.4-4.2A8.5 8.5 0 1 1 20.5 11.7z"/><path d="M8.5 11.7h7M8.5 8.7h4.6"/></svg>';
  var CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }
  function normalise(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  }
  function includesPhrase(message, phrase) {
    return (" " + message + " ").indexOf(" " + phrase + " ") !== -1;
  }
  function isCompactGreeting(message) {
    return /^(hi|hello|hey|good morning|good afternoon|good evening)$/.test(message);
  }
  function action(label, type, value, extra) {
    var result = { label: label, type: type, value: value };
    if (extra) Object.keys(extra).forEach(function (key) { result[key] = extra[key]; });
    return result;
  }
  function menuAction() { return action("Main Menu", "intent", "menu"); }
  function collectionAction(key) {
    var collection = data.collectionCopy[key];
    return action("View " + collection.label, "link", collection.url);
  }
  function renderMessage(kind, html) {
    var item = document.createElement("div");
    item.className = "orchids-chat__message orchids-chat__message--" + kind;
    item.innerHTML = '<div class="orchids-chat__bubble">' + html + "</div>";
    els.messages.appendChild(item);
    els.messages.scrollTop = els.messages.scrollHeight;
  }
  function renderActions(actions) {
    if (!actions || !actions.length) return;
    var wrap = document.createElement("div");
    wrap.className = "orchids-chat__actions";
    actions.forEach(function (item) {
      var control = document.createElement(item.type === "link" || item.type === "wa" || item.type === "tel" ? "a" : "button");
      control.className = "orchids-chat__action" + (item.type === "wa" ? " orchids-chat__action--wa" : "");
      control.textContent = item.label;
      if (item.type === "link") {
        control.href = item.value;
        if (item.target) { control.target = item.target; control.rel = "noopener"; }
      }
      if (item.type === "tel") control.href = item.value;
      if (item.type === "wa") {
        control.href = "https://wa.me/" + business.whatsappNumber + "?text=" + encodeURIComponent(item.value);
        control.target = "_blank";
        control.rel = "noopener";
      }
      if (item.type === "intent") {
        control.type = "button";
        control.addEventListener("click", function () { respond(item.value, item.label); });
      }
      if (item.type === "link") control.addEventListener("click", closeChat);
      wrap.appendChild(control);
    });
    els.messages.appendChild(wrap);
    els.messages.scrollTop = els.messages.scrollHeight;
  }
  function bot(html, actions) {
    renderMessage("bot", html);
    renderActions(actions);
  }
  function mainMenu() {
    state.context = "main";
    bot("<p>How can I assist you today?</p>", data.quickActions.map(function (item) { return action(item.label, "intent", item.intent); }));
  }
  function collectionResponse(key) {
    var collection = data.collectionCopy[key];
    if (!collection) return fallback();
    state.context = "collection:" + key;
    bot("<p>Yes — " + escapeHtml(collection.text) + "</p><p>Would you like to explore this collection?</p>", [
      collectionAction(key),
      action("Other Collections", "intent", "collections"),
      menuAction()
    ]);
  }
  function collectionMenu() {
    state.context = "collections";
    bot("<p>Discover the ORCHIDS collections. Choose one to explore.</p>", [
      collectionAction("sarees"), collectionAction("kurtis"), collectionAction("ethnic"),
      collectionAction("new"), collectionAction("exclusive"), menuAction()
    ]);
  }
  function apparelResponse() {
    state.context = "apparel";
    bot("<p>ORCHIDS offers premium kurtis and ethnic wear for everyday elegance and special celebrations. Which collection would you like to explore?</p>", [
      collectionAction("kurtis"), collectionAction("ethnic"), menuAction()
    ]);
  }
  function stitchingResponse() {
    state.context = "stitching";
    bot("<p>Absolutely! ORCHIDS offers custom stitching services. You can share a design or pattern reference that you like, including inspiration from movies, social media or online designs.</p><p>Would you like to share your reference image with our boutique team?</p>", [
      action("Share Pattern on WhatsApp", "wa", "Hello ORCHIDS! I would like to share a design reference for custom stitching."),
      menuAction()
    ]);
  }
  function locationResponse() {
    state.context = "location";
    bot("<p>You are welcome to visit ORCHIDS Designer Store.</p><p><strong>" + business.addressHtml + "</strong></p>", [
      action("Get Directions", "link", business.mapUrl, { target: "_blank" }),
      action("Contact Our Team", "intent", "contact"),
      menuAction()
    ]);
  }
  function contactResponse() {
    state.context = "contact";
    bot("<p>You can call ORCHIDS at <strong>" + escapeHtml(business.phoneDisplay) + "</strong>, visit the boutique, or use this assistant to explore our collections.</p>", [
      action("Call ORCHIDS", "tel", business.phoneLink),
      action("Get Directions", "link", business.mapUrl, { target: "_blank" }),
      menuAction()
    ]);
  }
  function priceResponse() {
    state.context = "product";
    bot("<p>Our boutique team will be happy to assist with product details and pricing. Please choose the collection or product you are interested in.</p>", [
      action("Explore Collections", "intent", "collections"), action("Sarees", "intent", "sarees"), action("Kurtis & Ethnic Wear", "intent", "apparel"), menuAction()
    ]);
  }
  function availabilityResponse() {
    state.context = "product";
    bot("<p>For availability, please choose the collection or product you are interested in. Our website does not show live stock information.</p>", [
      action("Explore Collections", "intent", "collections"), action("Custom Stitching", "intent", "stitching"), menuAction()
    ]);
  }
  function productResponse(product) {
    state.context = "product";
    bot("<p>You are asking about <strong>" + escapeHtml(product.name) + "</strong>. You can view it in the collection and use its Enquire button to ask the boutique about it.</p>", [
      action("View " + product.name, "link", "collections.html#" + product.category), menuAction()
    ]);
  }
  function fallback() {
    state.context = "fallback";
    bot("<p>I’m sorry, I couldn’t quite understand that. 🌸</p><p>I can help you explore our collections, learn about our services or find boutique information.</p><p>What would you like to know?</p>", [
      action("Explore Collections", "intent", "collections"), action("Custom Stitching", "intent", "stitching"), action("Boutique Information", "intent", "location"), menuAction()
    ]);
  }
  function resolveIntent(raw) {
    return window.ORCHIDS_CHATBOT_MATCH_INTENT(raw, window.ORCHIDS_PRODUCTS || []);
  }
  function respond(intentId, label, product) {
    if (label) renderMessage("user", "<p>" + escapeHtml(label) + "</p>");
    var intent = intentId;
    if (typeof intentId === "object") { product = intentId.product; intent = intentId.id; }
    if (intent === "menu" || intent === "greeting") return mainMenu();
    if (intent === "collections" || intent === "product") return product ? productResponse(product) : collectionMenu();
    if (intent === "sarees" || intent === "kurtis" || intent === "ethnic" || intent === "new" || intent === "exclusive") return collectionResponse(intent);
    if (intent === "apparel") return apparelResponse();
    if (intent === "stitching") return stitchingResponse();
    if (intent === "location") return locationResponse();
    if (intent === "contact") return contactResponse();
    if (intent === "price") return priceResponse();
    if (intent === "availability") return availabilityResponse();
    return fallback();
  }
  function handleText(value) {
    var clean = String(value || "").trim();
    if (!clean) return;
    renderMessage("user", "<p>" + escapeHtml(clean) + "</p>");
    var intent = resolveIntent(clean);
    if (!intent) return fallback();
    if (intent.id === "greeting" && !isCompactGreeting(normalise(clean))) return mainMenu();
    respond(intent, "");
  }
  function openChat() {
    state.open = true;
    state.lastFocus = document.activeElement;
    els.panel.classList.add("is-open");
    els.panel.setAttribute("aria-hidden", "false");
    els.trigger.setAttribute("aria-expanded", "true");
    if (!state.welcomed) {
      state.welcomed = true;
      bot("<p>Hello! Welcome to ORCHIDS Designer Store. 🌸</p><p>I’m here to help you explore our collections, learn about our services and answer your questions.</p>");
      mainMenu();
    }
    window.setTimeout(function () { els.input.focus(); }, 180);
  }
  function closeChat() {
    state.open = false;
    els.panel.classList.remove("is-open");
    els.panel.setAttribute("aria-hidden", "true");
    els.trigger.setAttribute("aria-expanded", "false");
    if (state.lastFocus && state.lastFocus !== els.trigger) state.lastFocus.focus();
  }
  function build() {
    document.querySelectorAll(".wa-float").forEach(function (node) { node.remove(); });
    var root = document.createElement("section");
    root.className = "orchids-chat";
    root.innerHTML =
      '<button class="orchids-chat__trigger" type="button" aria-label="Open ORCHIDS assistant" aria-controls="orchids-chat-panel" aria-expanded="false"><span class="orchids-chat__trigger-orchid"><img src="assets/images/logo/orchids-mark-on-dark.svg" alt=""></span><span class="orchids-chat__trigger-label">The ORCHIDS Concierge</span></button>' +
      '<aside class="orchids-chat__panel" id="orchids-chat-panel" aria-label="ORCHIDS website assistant" aria-hidden="true">' +
        '<header class="orchids-chat__header"><span class="orchids-chat__mark" aria-hidden="true"><img src="assets/images/logo/orchids-mark-on-dark.svg" alt=""></span><div><strong>ORCHIDS</strong><small>Private Boutique Assistant · Coimbatore</small></div><button type="button" class="orchids-chat__close" aria-label="Minimize ORCHIDS assistant">' + CLOSE + '</button></header>' +
        '<div class="orchids-chat__messages" aria-live="polite" aria-relevant="additions"></div>' +
        '<form class="orchids-chat__form"><label class="visually-hidden" for="orchids-chat-input">Ask ORCHIDS a question</label><input id="orchids-chat-input" type="text" autocomplete="off" placeholder="Ask about collections or services…"><button type="submit" aria-label="Send message">' + ICON + '</button></form>' +
      '</aside>';
    document.body.appendChild(root);
    els.trigger = root.querySelector(".orchids-chat__trigger");
    els.panel = root.querySelector(".orchids-chat__panel");
    els.messages = root.querySelector(".orchids-chat__messages");
    els.input = root.querySelector("input");
    els.trigger.addEventListener("click", function () { state.open ? closeChat() : openChat(); });
    root.querySelector(".orchids-chat__close").addEventListener("click", closeChat);
    root.querySelector(".orchids-chat__form").addEventListener("submit", function (event) {
      event.preventDefault();
      var value = els.input.value;
      els.input.value = "";
      handleText(value);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && state.open) closeChat();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
