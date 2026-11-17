# ORCHIDS WhatsApp Customer Assistant

This service connects the existing ORCHIDS website to the official Meta WhatsApp Business Platform (Cloud API). It does not change the website’s design or add checkout/payment features.

## What it does

- Verifies Meta webhooks and validates every incoming webhook with `X-Hub-Signature-256`.
- Sends an elegant main menu using a WhatsApp list message, with text/number intent fallback.
- Handles product enquiries, collection navigation, product-specific website messages, location requests, and pricing questions without inventing prices or stock.
- Keeps a state and history per customer number.
- Moves custom-stitching and "speak to team" conversations immediately to `HUMAN_HANDOVER`.
- Records the handover reason, timestamp, category, and customer number.
- Sends **no automatic response at all** while a conversation is in `HUMAN_HANDOVER` or `HUMAN_ACTIVE`, including after image uploads.
- Offers a protected endpoint for an authorized team member to resume automation.

## Before it can go live

1. In Meta for Developers, create/select the ORCHIDS WhatsApp Business app and add the WhatsApp product.
2. Add and verify the official business number `+91 93840 46656` with Meta.
3. Copy `.env.example` to `.env` and fill in the Meta values. Never put secrets in the website files.
4. Set `ORCHIDS_WEBSITE_URL` to the live website URL and set a long random `HANDOVER_ADMIN_TOKEN`.
5. Deploy this service to a public HTTPS host. The existing static host alone cannot receive webhooks.
6. In Meta, set the callback URL to `https://YOUR-ASSISTANT-DOMAIN/webhook`, subscribe to `messages`, and use the same `WHATSAPP_VERIFY_TOKEN`.
7. Configure a private staff notification endpoint in `HANDOVER_NOTIFICATION_WEBHOOK` if the team uses one. Otherwise, monitor the WhatsApp Business inbox for handover conversations.

Meta credentials, Meta business verification/approvals, a public HTTPS deployment, and the staff notification destination are still required. Until these are configured, the service safely accepts no live WhatsApp traffic and does not claim automation is active.

## Local setup

Requires Node.js 18 or later. No npm dependencies are needed.

```powershell
Copy-Item .env.example .env
# Fill .env with real values only on the server.
npm test
npm start
```

Health check: `GET /health` reports whether API and website configuration are present. It never exposes secrets.

## Webhook routes

- `GET /webhook` — Meta webhook verification.
- `POST /webhook` — signed inbound WhatsApp events.
- `GET /health` — safe service status.
- `POST /admin/conversations/:PHONE/resume` — resumes a handover conversation. Requires `Authorization: Bearer HANDOVER_ADMIN_TOKEN`.

Example for an authorized operator:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "https://YOUR-ASSISTANT-DOMAIN/admin/conversations/919900000001/resume" `
  -Headers @{ Authorization = "Bearer YOUR_HANDOVER_ADMIN_TOKEN" }
```

Use this only after the boutique team has finished personally assisting the customer. The WhatsApp Business app/inbox remains the correct place for staff to reply during a handover.

## Compliance notes

- Cloud API replies are sent only in response to incoming customer messages. Sending messages outside Meta’s permitted customer-service window requires an approved Meta message template; this service does not bypass that rule.
- No unsolicited broadcasts are implemented.
- Customer history is stored locally in `data/conversations.json` for a single deployment instance. It is ignored by Git. For multi-instance production hosting, replace `ConversationStore` with a managed encrypted database before scaling.
- Restrict the admin resume endpoint at the hosting/network layer as well as using the bearer token.

## Test coverage

`npm test` covers greeting/menu, product and saree collection flow, product-specific website context, custom-stitching handover/no reply after a customer image, and location response. Before launch, also test against a Meta test number: all four menu paths, two simultaneous customers, invalid credentials, webhook verification, and staff resume.
