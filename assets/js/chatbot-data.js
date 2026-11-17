/* ========================================================================
   ORCHIDS — Website assistant knowledge base
   Rule based only. No AI model, API, remote service or customer data store.
   Update business facts and phrase variations here as ORCHIDS grows.
   ======================================================================== */
(function () {
  "use strict";

  window.ORCHIDS_CHATBOT_DATA = {
    business: {
      name: "ORCHIDS Designer Store",
      phoneDisplay: "+91 93840 46656",
      phoneLink: "tel:+919384046656",
      whatsappNumber: "919384046656",
      mapUrl: "https://www.google.com/maps/search/?api=1&query=Orchids+Designer+Store+KK+Nagar+Sundakkamuthur+Coimbatore+641010",
      addressHtml: "Opposite Ashram School &amp; ICICI Bank,<br>KK Nagar, Sundakkamuthur,<br>Coimbatore, Tamil Nadu – 641010."
    },
    quickActions: [
      { label: "Explore Collections", intent: "collections" },
      { label: "Sarees", intent: "sarees" },
      { label: "Kurtis & Ethnic Wear", intent: "apparel" },
      { label: "Custom Stitching", intent: "stitching" },
      { label: "Boutique Information", intent: "location" },
      { label: "Contact Our Team", intent: "contact" }
    ],
    collectionCopy: {
      sarees: {
        label: "Designer Sarees",
        url: "collections.html#sarees",
        text: "Our designer saree collection brings together elegant drapes with refined borders, rich textures and fine embroidery for weddings, festivals and celebrations."
      },
      kurtis: {
        label: "Premium Kurtis",
        url: "collections.html#kurtis",
        text: "Our premium kurtis feature considered silhouettes and fine detailing, with styles suited to everyday wear, workwear and occasions."
      },
      ethnic: {
        label: "Ethnic Wear",
        url: "collections.html#ethnic",
        text: "Our ethnic wear collection includes traditional and contemporary ensembles, from anarkalis to sharara sets, selected for celebrations."
      },
      new: {
        label: "New Arrivals",
        url: "collections.html#new",
        text: "New Arrivals brings together the latest pieces to arrive at the ORCHIDS boutique."
      },
      exclusive: {
        label: "Exclusive Collections",
        url: "collections.html#exclusive",
        text: "Our Exclusive Collections are a small selection of statement pieces chosen for clients looking for something distinctive."
      }
    },
    intents: [
      { id: "menu", phrases: ["main menu", "menu", "start over", "home menu"] },
      { id: "greeting", phrases: ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"] },
      { id: "stitching", priority: 100, phrases: ["custom stitching", "stitching", "blouse stitching", "dress stitching", "stitch a dress", "stitch my blouse", "share a design", "share design", "share a pattern", "pattern stitching", "pattern online", "saw a pattern", "saw a design", "design reference", "reference photo", "reference image", "movie design", "movie inspired", "online design", "online reference", "bring my design", "bring my own pattern", "own design"] },
      { id: "location", phrases: ["where are you", "where is your boutique", "where is your store", "store location", "boutique location", "your address", "address", "how can i visit", "can i visit", "visit the boutique", "directions", "google maps", "located"] },
      { id: "contact", phrases: ["contact", "contact number", "phone number", "call", "reach you", "talk to team", "contact team", "boutique team", "speak to someone", "talk to the owner", "speak to the owner"] },
      { id: "price", phrases: ["price", "prices", "cost", "how much", "rate", "rates", "discount", "offer"] },
      { id: "availability", phrases: ["available", "availability", "in stock", "stock", "do you have this"] },
      { id: "sarees", priority: 100, phrases: ["saree", "sarees", "designer saree", "designer sarees", "saree collection", "show sarees"] },
      { id: "kurtis", priority: 100, phrases: ["kurti", "kurtis", "premium kurti", "kurta", "kurta set"] },
      { id: "ethnic", priority: 100, phrases: ["ethnic", "ethnic wear", "anarkali", "anarkalis", "sharara", "sharara set", "lehenga", "ghagra", "ensemble"] },
      { id: "new", priority: 100, phrases: ["new arrival", "new arrivals", "latest collection", "latest pieces", "whats new", "what is new"] },
      { id: "exclusive", priority: 100, phrases: ["exclusive", "exclusive collection", "statement pieces"] },
      { id: "collections", phrases: ["collections", "collection", "what do you sell", "products", "what products", "show me", "browse"] },
      { id: "product", phrases: ["product enquiry", "product inquiry", "particular product", "specific product", "enquire about a product", "product details"] }
    ]
  };

  /* Kept here with the phrases so the rule set can be tested independently
     from the chat interface. The function returns only configured intents. */
  window.ORCHIDS_CHATBOT_MATCH_INTENT = function (input, products) {
    var message = String(input || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    if (!message) return null;
    var catalogue = products || [];
    var product = catalogue.filter(function (item) {
      var name = String(item.name || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
      return name.length > 4 && (message.indexOf(name) !== -1 || (name.indexOf(message) !== -1 && message.length > 5));
    })[0];
    if (product) return { id: "product", product: product };

    var best = null;
    window.ORCHIDS_CHATBOT_DATA.intents.forEach(function (intent) {
      intent.phrases.forEach(function (phrase) {
        var hit = (" " + message + " ").indexOf(" " + phrase + " ") !== -1;
        var score = phrase.length + (intent.priority || 0);
        if (hit && (!best || score > best.score)) best = { id: intent.id, length: phrase.length, score: score };
      });
    });
    return best;
  };
})();
