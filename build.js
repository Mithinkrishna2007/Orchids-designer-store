/* ORCHIDS — page assembler
   Shared header + footer are taken from index.html (the master page).
   Page bodies live in /src. Run:  node build.js
*/
const fs = require("fs");
const path = require("path");

const DOMAIN = "https://www.example.com"; // REPLACE with the live domain
const root = __dirname;
const master = fs.readFileSync(path.join(root, "index.html"), "utf8");

const header = master.slice(master.indexOf('<a class="skip-link"'), master.indexOf("</header>") + 9);
const footer = master.slice(master.indexOf('<footer class="footer">'), master.indexOf("</body>"));
const homeSchema = JSON.parse(master.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const store = (homeSchema["@graph"] || [homeSchema]).find((entry) => {
  const type = entry["@type"];
  return type === "ClothingStore" || (Array.isArray(type) && type.includes("ClothingStore"));
});

if (!store) throw new Error("Could not find the ORCHIDS ClothingStore schema in index.html");

const pages = [
  {
    file: "about", nav: "About Us", crumb: "About Us",
    title: "About ORCHIDS | Premium Designer Boutique in Coimbatore",
    desc: "Discover ORCHIDS, a premium designer boutique in KK Nagar, Sundakkamuthur, Coimbatore. Designer sarees, kurtis, ethnic wear and personalised stitching."
  },
  {
    file: "collections", nav: "Collections", crumb: "Collections",
    title: "Designer Sarees, Kurtis & Ethnic Wear Collections | ORCHIDS Coimbatore",
    desc: "Explore designer sarees, premium kurtis, ethnic wear, new arrivals and exclusive collections at ORCHIDS, a designer boutique in Coimbatore near Kovaiputhur. Enquire on WhatsApp."
  },
  {
    file: "services", nav: "Services", crumb: "Services",
    title: "Custom Stitching & Designer Boutique Services in Coimbatore | ORCHIDS",
    desc: "Custom stitching and personalised pattern stitching in Coimbatore. Share your design reference with ORCHIDS on WhatsApp. Serving Kovaiputhur, Sundakkamuthur and KK Nagar.",
    faq: true
  },
  {
    file: "gallery", nav: "Gallery", crumb: "Gallery",
    title: "Gallery | ORCHIDS Designer Boutique, Coimbatore",
    desc: "Browse the ORCHIDS gallery: designer sarees, kurtis, ethnic wear, custom stitching and the boutique interior in Coimbatore."
  },
  {
    file: "contact", nav: "Contact", crumb: "Contact",
    title: "Contact ORCHIDS | Designer Store in Sundakkamuthur, Coimbatore",
    desc: "Visit ORCHIDS Designer Store, opposite Ashram School & ICICI Bank, KK Nagar, Sundakkamuthur, Coimbatore 641010. WhatsApp +91 93840 46656. Serving Kovaiputhur.",
    fullStore: true
  },
];

const escAttr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

function faqSchema(html) {
  const items = [...html.matchAll(/<details><summary>(.*?)<\/summary><p>(.*?)<\/p><\/details>/g)];
  return {
    "@type": "FAQPage",
    mainEntity: items.map((m) => ({
      "@type": "Question",
      name: m[1].replace(/&amp;/g, "&"),
      acceptedAnswer: { "@type": "Answer", text: m[2].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&") }
    }))
  };
}

for (const p of pages) {
  const body = fs.readFileSync(path.join(root, "src", p.file + ".html"), "utf8");
  const url = `${DOMAIN}/${p.file}`;
  const graph = [
    {
      "@type": "WebPage", "@id": url + "#webpage", url, name: p.title, description: p.desc,
      inLanguage: "en-IN", about: { "@id": `${DOMAIN}/#store` }
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${DOMAIN}/` },
        { "@type": "ListItem", position: 2, name: p.crumb, item: url }
      ]
    }
  ];
  if (p.fullStore) { const s = { ...store }; delete s["@context"]; graph.push(s); }
  if (p.faq) graph.push(faqSchema(body));

  const nav = header
    .replace(' aria-current="page"', "")
    .replace(`>${p.nav}</a></li>`, ` aria-current="page">${p.nav}</a></li>`);

  const html = `<!doctype html>
<html lang="en-IN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${p.title.replace(/&/g, "&amp;")}</title>
  <meta name="description" content="${escAttr(p.desc)}">
  <link rel="canonical" href="${url}">${p.noindex ? '\n  <meta name="robots" content="noindex">' : ""}
  <meta name="theme-color" content="#A65332">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="ORCHIDS Designer Store">
  <meta property="og:title" content="${escAttr(p.title)}">
  <meta property="og:description" content="${escAttr(p.desc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${DOMAIN}/assets/images/og-image.jpg">
  <meta property="og:locale" content="en_IN">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="assets/images/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="assets/images/favicon-32.png" type="image/png" sizes="32x32">
  <link rel="apple-touch-icon" href="assets/images/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/styles.css">
  <script type="application/ld+json">
${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2)}
  </script>
</head>
<body>
<!-- GENERATED by build.js from src/${p.file}.html. Edit the source, then run: node build.js -->
${nav}

${body.trim()}

${footer.trim()}
</body>
</html>
`;
  fs.writeFileSync(path.join(root, p.file + ".html"), html);
  console.log("built", p.file + ".html");
}
