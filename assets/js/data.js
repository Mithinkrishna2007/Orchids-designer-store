/* ==========================================================================
   ORCHIDS — Editable site data
   --------------------------------------------------------------------------
   HOW TO UPDATE
   • Products: edit / add entries in ORCHIDS_PRODUCTS below.
       - category : "sarees" | "kurtis" | "ethnic" | "new"
       - id       : stable product identifier — retain it when adding the
                    matching client photograph later.
       - tags     : use "exclusive" for Exclusive Collections and
                    "featured" for the homepage.
       - image    : path to the real ORCHIDS photograph. Until the file
                    exists, an elegant placeholder is shown automatically.
       - tone     : placeholder colour — terracotta | sienna | rose |
                    champagne | ivory | espresso
   • Gallery: edit ORCHIDS_GALLERY.
   • NO PRICES are shown anywhere — by design. Do not add a price field.

   NOTE: Product names below are the client-approved collection names.
   Entries with image: "" are intentional placeholders, ready for the
   corresponding ORCHIDS photoshoot image to be added later.
   ========================================================================== */

window.ORCHIDS_CONFIG = {
  whatsappNumber: "919384046656",
  defaultMessage: "Hello ORCHIDS! I would like to know more about your collections."
};

window.ORCHIDS_CATEGORIES = {
  sarees: "Designer Sarees",
  kurtis: "Premium Kurtis",
  ethnic: "Ethnic Wear",
  new: "New Arrivals"
};

window.ORCHIDS_PRODUCTS = [
  /* ---------- Designer Sarees ---------- */
  {
    id: "sarees-block-print-sarees",
    name: "Block Print Sarees",
    category: "sarees",
    tags: [],
    description: "",
    details: [],
    image: "assets/images/products/orchids/block-print-sarees.png",
    tone: "terracotta"
  },
  {
    id: "sarees-kalamkari-print-sarees",
    name: "Kalamkari Print Sarees",
    category: "sarees",
    tags: [],
    description: "",
    details: [],
    image: "assets/images/products/orchids/kalamkari-print-sarees.png",
    tone: "sienna"
  },
  {
    id: "sarees-pure-tussar-sarees",
    name: "Pure Tussar Sarees",
    category: "sarees",
    tags: [],
    description: "",
    details: [],
    image: "assets/images/products/orchids/pure-tussar-sarees-01.png",
    images: [
      "assets/images/products/orchids/pure-tussar-sarees-01.png",
      "assets/images/products/orchids/pure-tussar-sarees-02.png"
    ],
    tone: "sienna"
  },

  /* ---------- Premium Kurtis ---------- */
  {
    id: "kurtis-mix-cotton-kurthis",
    name: "Mix Cotton Kurthis",
    category: "kurtis",
    tags: [],
    description: "A blend of everyday comfort and effortless style, perfect for a graceful look throughout the day.",
    details: ["Sizes and fabric details shared on enquiry", "Fit alterations can be discussed", "Everyday and office wear"],
    image: "assets/images/products/ivory-threadwork-kurti.jpg",
    tone: "champagne"
  },
  {
    id: "kurtis-modal-silk-kurthis",
    name: "Modal Silk Kurthis",
    category: "kurtis",
    tags: [],
    description: "Experience a refined look with the smooth appeal and graceful drape of Modal Silk.",
    details: ["Sizes and fabric details shared on enquiry", "Fit alterations can be discussed", "Festive and occasion wear"],
    image: "assets/images/products/sienna-anarkali-kurti.jpg",
    tone: "sienna"
  },
  {
    id: "kurtis-semi-model-silk-kurthis",
    name: "Semi Model Silk Kurthis",
    category: "kurtis",
    tags: [],
    description: "Combining a graceful appearance with versatile styling, these pieces bring effortless elegance to every occasion.",
    details: ["Sizes and fabric details shared on enquiry", "Fit alterations can be discussed", "Day-to-evening wear"],
    image: "assets/images/products/rose-straight-kurti.jpg",
    tone: "rose"
  },
  {
    id: "kurtis-pure-cotton-kurthis",
    name: "Pure Cotton Kurthis",
    category: "kurtis",
    tags: [],
    description: "Naturally comfortable and effortlessly stylish, perfect for everyday wear with a touch of elegance.",
    details: ["Sizes and fabric details shared on enquiry", "Fit alterations can be discussed", "Festive wear"],
    image: "assets/images/products/champagne-festive-kurti.jpg",
    tone: "ivory"
  },

  /* ---------- Ethnic Wear ---------- */
  {
    id: "ethnic-kotaa-sarees",
    name: "Kotaa Sarees",
    category: "ethnic",
    tags: [],
    description: "",
    details: [],
    image: "assets/images/products/orchids/Kotaa-sarees.png",
    tone: "rose"
  },
  {
    id: "ethnic-pure-cotton-sarees",
    name: "Pure cotton sarees",
    category: "ethnic",
    tags: [],
    description: "",
    details: [],
    image: "assets/images/products/orchids/pure-cotton-sarees.png",
    tone: "champagne"
  },
  {
    id: "ethnic-semi-silk-sarees",
    name: "Semi Silk Sarees",
    category: "ethnic",
    tags: [],
    description: "",
    details: [],
    image: "assets/images/products/orchids/semi-silk-sarees.png",
    tone: "sienna"
  },
  {
    id: "ethnic-emerald-zari-border-saree",
    name: "Emerald Zari Border Saree",
    category: "ethnic",
    tags: [],
    description: "A deep emerald saree finished with an ornate antique-gold zari border and a woven floral medallion, composed for festive occasions.",
    details: [],
    image: "assets/images/products/orchids/emerald-zari-border-saree.png",
    tone: "sienna"
  },

  /* ---------- New Arrivals ---------- */
  {
    id: "new-mul-cotton-sarees",
    name: "Mul Cotton Sarees",
    category: "new",
    tags: ["new"],
    description: "",
    details: [],
    image: "assets/images/products/orchids/new-mul-cotton-sarees.png",
    tone: "ivory"
  },
  {
    id: "new-pure-chanderi-sarees",
    name: "Pure Chanderi Sarees",
    category: "new",
    tags: ["new"],
    description: "",
    details: [],
    image: "assets/images/products/orchids/new-pure-chanderi-sarees.png",
    tone: "rose"
  },
  {
    id: "new-pure-lenin-sarees",
    name: "Pure Lenin Sarees",
    category: "new",
    tags: ["new"],
    description: "",
    details: [],
    image: "assets/images/products/orchids/new-pure-lenin-sarees.png",
    tone: "champagne"
  },
  {
    id: "new-honey-gold-brocade-saree",
    name: "Honey Gold Brocade Saree",
    category: "new",
    tags: ["new"],
    description: "Warm honey-gold drape with a finely woven brocade pallu, balanced by a muted silver-grey edge for a quietly luminous festive look.",
    details: [],
    image: "assets/images/products/orchids/honey-gold-brocade-saree.png",
    tone: "champagne"
  },

  /* ---------- Exclusive Collections ---------- */
  {
    id: "exclusive-banthini-sarees",
    name: "Exclusive Banthini Sarees",
    category: "sarees",
    tags: ["exclusive"],
    description: "",
    details: [],
    image: "assets/images/products/orchids/exclusive-banthini-sarees.png",
    tone: "terracotta"
  },
  {
    id: "exclusive-pure-cotton-sarees",
    name: "Exclusive Pure cotton sarees",
    category: "sarees",
    tags: ["exclusive"],
    description: "",
    details: [],
    image: "assets/images/products/orchids/pure-cotton-sarees.png",
    tone: "champagne"
  },
  {
    id: "exclusive-mul-cotton-sarees",
    name: "Mul Cotton sarees",
    category: "sarees",
    tags: ["exclusive"],
    description: "",
    details: [],
    image: "assets/images/products/orchids/exclusive-mul-cotton-sarees.png",
    tone: "ivory"
  }
];

/* Gallery images are limited to four confirmed photographs per category. The
   current collection assets are used wherever available; page art, frames,
   logo files, backgrounds and unapproved imagery are intentionally excluded. */
window.ORCHIDS_GALLERY = [
  /* Sarees added to the current collection */
  { image: "assets/images/products/orchids/block-print-sarees.png", category: "sarees", caption: "Block Print Sarees", ratio: "ratio-portrait", tone: "terracotta", featured: true },
  { image: "assets/images/products/orchids/kalamkari-print-sarees.png", category: "sarees", caption: "Kalamkari Print Sarees", ratio: "ratio-portrait", tone: "sienna" },
  { image: "assets/images/products/orchids/pure-tussar-sarees-01.png", category: "sarees", caption: "Pure Tussar Sarees", ratio: "ratio-portrait", tone: "sienna" },
  { image: "assets/images/products/orchids/new-pure-chanderi-sarees.png", category: "sarees", caption: "Pure Chanderi Sarees", ratio: "ratio-portrait", tone: "rose" },

  /* Current Premium Kurtis collection */
  { image: "assets/images/products/ivory-threadwork-kurti.jpg", category: "kurtis", caption: "Mix Cotton Kurthis", ratio: "ratio-portrait", tone: "champagne", featured: true },
  { image: "assets/images/products/sienna-anarkali-kurti.jpg", category: "kurtis", caption: "Modal Silk Kurthis", ratio: "ratio-portrait", tone: "sienna" },
  { image: "assets/images/products/rose-straight-kurti.jpg", category: "kurtis", caption: "Semi Model Silk Kurthis", ratio: "ratio-portrait", tone: "rose" },
  { image: "assets/images/products/champagne-festive-kurti.jpg", category: "kurtis", caption: "Pure Cotton Kurthis", ratio: "ratio-portrait", tone: "ivory" },

  /* Current Ethnic Wear collection */
  { image: "assets/images/products/orchids/Kotaa-sarees.png", category: "ethnic", caption: "Kotaa Sarees", ratio: "ratio-portrait", tone: "rose", featured: true },
  { image: "assets/images/products/orchids/pure-cotton-sarees.png", category: "ethnic", caption: "Pure Cotton Sarees", ratio: "ratio-portrait", tone: "champagne" },
  { image: "assets/images/products/orchids/semi-silk-sarees.png", category: "ethnic", caption: "Semi Silk Sarees", ratio: "ratio-portrait", tone: "sienna" },
  { image: "assets/images/products/orchids/emerald-zari-border-saree.png", category: "ethnic", caption: "Emerald Zari Border Saree", ratio: "ratio-wide", tone: "sienna" },

  /* Approved tailoring photography */
  { image: "assets/images/custom-stitching.jpg", category: "stitching", caption: "Custom Stitching", ratio: "ratio-portrait", tone: "terracotta" },
  { image: "assets/images/service-stitching.jpg", category: "stitching", caption: "Tailored Finishing", ratio: "ratio-portrait", tone: "champagne" },
  { image: "assets/images/stitching-hero.jpg", category: "stitching", caption: "Made to Measure", ratio: "ratio-portrait", tone: "sienna" },
  { image: "assets/images/stitching-detail.jpg", category: "stitching", caption: "Stitching Detail", ratio: "ratio-square", tone: "rose" },

  /* Approved ORCHIDS boutique interiors */
  { image: "assets/images/boutique-01.jpg", category: "interior", caption: "Boutique Interior", ratio: "ratio-portrait", tone: "champagne", featured: true },
  { image: "assets/images/boutique-02.jpg", category: "interior", caption: "ORCHIDS Displays", ratio: "ratio-portrait", tone: "ivory" },
  { image: "assets/images/boutique-03.jpg", category: "interior", caption: "The Boutique Edit", ratio: "ratio-portrait", tone: "sienna" },
  { image: "assets/images/boutique-04.jpg", category: "interior", caption: "In Store", ratio: "ratio-portrait", tone: "champagne" }
];

window.ORCHIDS_GALLERY_CATEGORIES = {
  sarees: "Saree Collection",
  kurtis: "Kurti Collection",
  ethnic: "Ethnic Wear",
  stitching: "Custom Stitching",
  interior: "Boutique Interior"
};
