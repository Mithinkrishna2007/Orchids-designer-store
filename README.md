# ORCHIDS Designer Store: Website

Six-page static showcase site for ORCHIDS Designer Store, Coimbatore.
There is no build step needed to view it: open `index.html` in a browser.

## Structure

| Page | File | Clean URL |
|---|---|---|
| Home | `index.html` (also the master for the shared header and footer) | `/` |
| About Us | `about.html` | `/about` |
| Collections | `collections.html` | `/collections` |
| Services | `services.html` | `/services` |
| Gallery | `gallery.html` | `/gallery` |
| Contact | `contact.html` | `/contact` |

- `assets/css/styles.css`: design system (palette, type, components)
- `assets/images/ornaments/`: fine-line orchid motifs used for watermarks, dividers, seals and image placeholders
- `assets/js/data.js`: **editable products and gallery data**
- `assets/js/main.js`: nav, product cards, WhatsApp links, modal, gallery lightbox, contact form
- `src/*.html` + `build.js`: the inner pages are generated from these

### Editing pages
- **Home, header or footer:** edit `index.html`, then run `node build.js` so the other five pages pick up the change.
- **Inner page content:** edit `src/<page>.html`, then run `node build.js`. Don't edit the generated `about.html` and the other inner pages directly.

## Logo
The ORCHIDS logo is a fine-line botanical Phalaenopsis orchid on an arching stem with buds, drawn in the brand terracotta with a solid terracotta lip as the accent. The wordmark is set in Cormorant Garamond and Jost. The text is converted to outlines, so the files display correctly without the fonts installed.

`assets/images/logo/` holds SVG files (best for print and design work). `assets/images/logo/png/` holds high-resolution PNGs with transparent backgrounds:

| File | Use |
|---|---|
| `orchids-mark` | Orchid spray only, no text |
| `orchids-mark-on-dark` | Orchid spray for dark backgrounds |
| `orchids-logo-stacked` | Flower above the name: signage, labels, carry bags |
| `orchids-logo-horizontal` | Flower beside the name: letterheads, banners |
| `*-on-dark` / `*-mono` | For dark backgrounds / one-colour printing |
| `orchids-profile-ivory`, `orchids-profile-espresso` | Square 1080×1080 images for Instagram, WhatsApp Business and Google profiles |

The site header and footer use `logo/web/orchids-mark-header.svg` and `orchids-mark-footer.svg`. These are the same drawing with a heavier line, so it stays crisp at about 60px. The favicon (`favicon.svg`, `favicon-32.png`) and `apple-touch-icon.png` in `assets/images/` use the flower head alone with a bold line, which reads well at 16 to 32px.

## Before launch: checklist

1. **Domain:** replace `https://www.example.com` in `index.html`, `build.js`, `sitemap.xml` and `robots.txt`, then run `node build.js`.
2. **Photographs:** use only photographs that ORCHIDS owns or is authorised to use. Overwrite each image file with the approved photo under the same name. A slot whose file is deleted falls back to the terracotta orchid placeholder. Save ORCHIDS photos with these names (JPG, about 1600px on the long edge, compressed):
   - `assets/images/`: `hero.jpg`, `collection-sarees.jpg`, `collection-kurtis.jpg`, `collection-ethnic.jpg`, `custom-stitching.jpg`, `stitching-detail.jpg`, `boutique-01.jpg` to `boutique-05.jpg`, `about-banner.jpg`, `about-intro.jpg`, `about-collections.jpg`, `about-stitching.jpg`, `banner-sarees.jpg`, `banner-ethnic.jpg`, `service-sarees.jpg`, `service-kurtis.jpg`, `service-ethnic.jpg`, `service-stitching.jpg`, `service-pattern.jpg`, `stitching-hero.jpg`, `about-detail.jpg`, `feature-kurtis.jpg`, `feature-kurtis-detail.jpg`, and a portrait plus a close-up detail for each inner-page hero: `collections-hero.jpg` / `collections-hero-detail.jpg`, `services-hero.jpg` / `services-hero-detail.jpg`, `gallery-hero.jpg` / `gallery-hero-detail.jpg`, `contact-hero.jpg` / `contact-hero-detail.jpg`, plus `og-image.jpg` (1200×630, used for link previews)
   - `assets/images/products/`: names listed in `data.js`
   - `assets/images/gallery/`: names listed in `data.js`
3. **Products:** the 12 entries in `data.js` are **samples** for layout review. Replace them with real ORCHIDS pieces. Never add prices.
4. **Instagram:** add the URL in the footer of `index.html` (marked `REPLACE`).
5. **Opening hours:** add confirmed hours in `src/contact.html` (marked `REPLACE`), and optionally `openingHours` in the JSON-LD in `index.html`.
6. **Google Business Profile:** make sure the name, address and phone number on the profile match the website exactly.

## SEO included
- A unique title, meta description, canonical URL and Open Graph tags on every page
- `ClothingStore` LocalBusiness schema with the verified address and phone, and `areaServed` covering Kovaiputhur, Sundakkamuthur, KK Nagar and Coimbatore
- Breadcrumb schema on inner pages and FAQ schema on Services
- `sitemap.xml`, `robots.txt`, a Google Maps embed and a directions link
- Location wording keeps the address accurate: the store is in KK Nagar, Sundakkamuthur, and the site describes it as serving or near Kovaiputhur
- Clean URLs: `.htaccess` (Apache) and `vercel.json` are included; Netlify supports them automatically

## WhatsApp
Every product's Enquire button opens:
`https://wa.me/919384046656?text=Hello ORCHIDS! I am interested in the <Product Name>. Could you please share more details?`
(URL-encoded). The contact form also builds a WhatsApp message. No backend is needed.

## WhatsApp customer assistant

The website’s WhatsApp links open the official ORCHIDS number with the appropriate enquiry context. The optional production chatbot is a separate secure Cloud API backend in [`whatsapp-assistant/`](whatsapp-assistant/README.md). It is deliberately separate from this static site so Meta credentials are never exposed to visitors. Follow that guide to configure the Meta WhatsApp Business Platform webhook, handover controls and deployment. The automation is not live until those credentials and Meta webhook approvals are configured.
