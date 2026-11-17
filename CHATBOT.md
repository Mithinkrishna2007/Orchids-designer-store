# ORCHIDS Website Assistant

The ORCHIDS website assistant is a local, rule-based customer-support interface. It does not use an AI model, chatbot subscription, API, database, tracking service or WhatsApp automation.

## Files

- `assets/js/chatbot-data.js` — verified business information, quick actions, collection copy, supported phrases and the testable intent matcher.
- `assets/js/chatbot.js` — chat interface, conversation state, response routing and accessibility behaviour.
- `assets/js/data.js` — existing website product and collection data. The assistant reads this existing catalogue data for product-name recognition.
- `assets/css/styles.css` — assistant appearance and responsive layout.

## Supported intent groups

- Designer Sarees
- Premium Kurtis
- Ethnic Wear
- New Arrivals
- Exclusive Collections
- General collection browsing
- Product enquiry and product-name recognition
- Price and availability requests (without inventing prices or stock)
- Custom stitching, blouse stitching, design/pattern references and online/movie inspiration
- Boutique location and visiting
- Contact number and calling the boutique
- Main-menu and greeting requests
- Safe fallback for questions outside the configured knowledge base

## Conversation rules

- Opening the panel gives one welcome message per page load; reopening it preserves the conversation.
- Collection replies link to the relevant existing anchor on `collections.html`.
- The only chatbot route to WhatsApp is **Share Pattern on WhatsApp** in the custom-stitching flow. It uses the ORCHIDS business number with a prefilled design-reference message.
- The assistant never invents prices, availability, sizes, fabric details, offers or business hours.
- Unknown questions use a transparent fallback and return useful menu options.

## Updating the chatbot

Add or amend supported phrase variations and verified replies in `assets/js/chatbot-data.js`. Keep collection information aligned with the visible site content. For new products, add them to the existing `assets/js/data.js` catalogue; the assistant will recognize its configured product name automatically.
