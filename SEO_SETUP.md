# ORCHIDS SEO launch checklist

This website already includes page-specific titles and descriptions, Open Graph previews, canonical URLs, JSON-LD local-business data, an XML sitemap, crawl rules and semantic local-business content. These improvements help Google and AI systems identify ORCHIDS consistently; they do **not** guarantee a number-one ranking.

## Before publishing

1. Connect and publish the website on ORCHIDS' final HTTPS domain.
2. Run the following command once from this directory, replacing the example with the exact live domain:

   ```powershell
   node scripts/set-site-url.cjs https://www.your-domain.in
   ```

   This updates only the site-address metadata in HTML, `build.js`, `robots.txt` and `sitemap.xml`. It does not alter design, content or images.
3. Confirm that these URLs work publicly:
   - `https://your-domain.in/robots.txt`
   - `https://your-domain.in/sitemap.xml`
   - `https://your-domain.in/`
4. In Google Search Console, add and verify the domain property, then submit `https://your-domain.in/sitemap.xml`.
5. Validate the published homepage with Google's Rich Results Test. Fix any errors before requesting indexing.

## Local visibility essentials

1. Create or claim the official Google Business Profile with this exact, consistent information:
   - **Name:** ORCHIDS Designer Store
   - **Address:** Opposite Ashram School & ICICI Bank, KK Nagar, Sundakkamuthur, Coimbatore, Tamil Nadu 641010
   - **Phone / WhatsApp:** +91 93840 46656
   - **Website:** the final HTTPS website address
2. Keep that same name, address and phone number on the website, Google Business Profile, Instagram, Facebook, directories and maps listings.
3. Add accurate opening hours, boutique photographs, collection photographs and a clear business category to the verified Google Business Profile.
4. Request genuine customer reviews after completed visits or services. Never buy reviews or use misleading keyword-filled business names.
5. If ORCHIDS has verified social accounts, add their real URLs to the `sameAs` field in the homepage JSON-LD. Do not add unverified social profiles.

## Ongoing SEO work

- Update titles, descriptions and visible text whenever a collection or service changes.
- Keep the sitemap to canonical, indexable public pages only.
- Use real, descriptive image `alt` text and keep images compressed without sacrificing quality.
- Publish useful original content about new collections, local styling, custom stitching and boutique services—not copied or automatically generated filler.
- Monitor Search Console for indexing, queries, crawl errors and page experience after launch.

## AI search and ChatGPT

There is no supported switch that makes a site rank first in ChatGPT or Google. The best route is consistent public business information, technically crawlable pages, clear structured data, a verified Google Business Profile, respected local references and useful original content. `llms.txt` is provided as an additional plain-language business summary; it is not a guarantee that any AI system will use it.
