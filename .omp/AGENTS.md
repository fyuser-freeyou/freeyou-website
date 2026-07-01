# FreeYou — Project Context

## What FreeYou Is

FreeYou is a subscription companion platform (₹1,499/month) for India's 15M+ skilled freelancers.
It is **not** a marketplace. It gives freelancers legal protection, financial tools, community, and
curated client work (Studio model) — without taking a transaction cut. Entity: FY Freelancing
Solutions (OPC) Pvt. Ltd., Bangalore. Founder/sole director: Ronald.

─

## Tech Stack (Phase 1 — current)

| Layer | Choice |
|---|---|
| Frontend | Static HTML + embedded CSS + vanilla JS (no framework) |
| Hosting | Cloudflare Pages (`freeyou.co.in`) |
| Edge logic | Cloudflare Worker (`_worker.js`) |
| Analytics | PostHog (`phc_Chj2S9pvBJEaQfhRHuDoxyx3GvJGMPSy3r6AUSTueH2z`, US cloud) |
| CRM / Forms / E-sign | Zoho CRM, Zoho Forms, Zoho Sign, Zoho Bookings |
| Payments | Razorpay UPI Autopay (₹1,499/month recurring) |
| eKYC | Didit (primary) / Digio (fallback) — both UIDAI-approved AUAs |
| Community | Discord (role auto-assigned post-payment) |
| Automation | n8n (planned Month 2) |
| Version control | GitHub (`fyuser-freeyou/freeyou-website`) |

Phase 2 (Q3–Q4 2026) adds: Next.js 14, Supabase (Postgres + Auth), tRPC, Cloudflare R2, Resend,
WhatsApp Business API via Interakt.

─

## Project Structure

```
.
├── index.html            Main landing page — warm parchment/saffron/cream palette
├── landing-page.html     Earlier landing page iteration
├── landing-v2.html       Dark navy variant of the landing page
├── join.html             Multi-step membership application + Didit KYC flow
├── advisor-hub.html      Advisor-facing hub
├── _worker.js            Cloudflare Worker: proxies lead form → Zoho CRM, creates
│                           Didit KYC sessions, receives and verifies Didit webhooks
├── setup-github.sh       Git remote / GitHub setup script
├── docs/
│   ├── CTO-Architecture-Brief.md       Phase roadmap, data model, integrations, compliance
│   ├── Cofounder-Vision-Strategy.md    Mission, GTM, unit economics, operating principles
│   ├── Design-Brief-For-Claude-Tool.md Brand system: colors, typography, component specs
│   └── Social-Media-Strategy.md        Platform mix, content pillars, posting cadence
└── advisors/
    ├── freeyou-context.md   One-page shared context (prepend to every advisor session)
    ├── tech-advisor.md      CTO advisor system prompt
    ├── ops-advisor.md       COO advisor system prompt
    ├── legal-advisor.md     Legal advisor system prompt
    └── strategy-advisor.md  Strategy advisor system prompt
```

─

## Coding & Content Conventions

### HTML / CSS (landing pages)

- **Self-contained files.** Each page is one HTML file: `<style>` in `<head>`, `<script>` at bottom
  of `<body>`. No build step, no bundler, no imports.
- **CSS variables only.** Colors defined in `:root` as named vars (`--saffron`, `--cream`, etc.).
  Never hardcode hex in rules.
- **Two valid palettes — match the file you're editing:**
  - Light (index.html, landing-page.html): cream/parchment backgrounds, `--saffron: #E07B1A`
  - Dark (landing-v2.html): deep navy `#0A1628` backgrounds, saffron `#F5A623` / `#FF8C00` accents,
    teal `#00C9A7`, glassmorphism cards (`rgba(255,255,255,0.05–0.08)` + `backdrop-filter: blur(20–30px)`)
- **Fonts:** Sora (headlines, weight 700–800, letter-spacing −0.5px to −1px) + Inter (body,
  weight 400–600). Google Fonts. Never introduce a third font.
- **Layout:** `.container` max-width 1100px, `.section` padding 80px 0. 1440px desktop / 390px mobile.
- **Icons:** Outline style, 24px, stroke-width 1.5–2px (SVG inline).
- **Buttons:** Primary = saffron gradient + navy text + `border-radius: 8–10px`. Secondary =
  transparent border. Hover = `translateY(-2px)` lift.
- **No external JS libraries.** Vanilla JS only. PostHog is already initialized on every page —
  use `posthog.capture('event_name', props)` for new events; don't re-init.

### Copy rules
- Headlines: ≤ 8 words, no exclamation marks, no "leverage / synergy / game-changer /
  disrupting / world-class / empower / simple".
- Use ₹ symbol; reference Indian cities, UPI, WhatsApp naturally.
- CTA text: action-first ("Apply now", not "Click here to apply").
- Tone: direct, smart friend — not corporate, not startup-bro.

### Worker (`_worker.js`)
- ES module format: `export default { async fetch(request, env, ctx) {} }`.
- Routes: `POST /api/submit-lead`, `POST /api/kyc-session`, `POST /api/didit-webhook`.
- **Secrets belong in Cloudflare Worker env vars (Wrangler secrets), not hardcoded constants.**
  The two `ZOHO_TOKEN_*` constants at the top are known debt — reference `env.ZOHO_TOKEN_*` instead.
- All inbound webhooks must verify HMAC (`X-Signature-V2`). Use the existing `verifyHmac()` helper.
- Use the existing `jsonResponse()` helper for all responses.
- Never log or return Aadhaar numbers — strip before any log sink.

─

## Constraints from Advisor Docs

### Legal (hard limits — no exceptions)
- **Never store Aadhaar numbers.** Anywhere. Not in DB, not in logs, not in Worker responses.
  Store only: KYC status (bool), `kyc_reference_id` from Didit/Digio, verified name/DOB/address,
  timestamp.
- **Always use a licensed AUA** (Didit or Digio). Never build a direct Aadhaar/UIDAI integration.
- **DPDP Act 2023:** Collect only what's needed (current 5-field lead form is compliant). Show
  Privacy Notice before data collection. No personal data transfer outside India without explicit
  consent — Cloudflare R2 (US) is fine for non-sensitive static assets; use Indian region or
  Backblaze B2 India for anything sensitive (docs, KYC outputs).
- **GST:** SaaS subscription = 18% GST. Mandatory registration at ₹20L annual revenue. Razorpay
  must be configured to generate GST invoices from Day 1.
- **OPC limits:** Must convert to Pvt. Ltd. before paid-up capital > ₹50L OR turnover > ₹2Cr.
  Allow 2–3 months lead time — start conversion process early.
- Privacy Policy + Terms of Service must be live before any public launch.

### Ops
- Phase 1 is intentionally manual: Zoho CRM for lead qualification, Zoho Bookings for intro calls,
  Zoho Sign for membership agreements, Discord invite assigned manually until n8n is live.
- Month 2 target: fully automated pipeline — Zoho Form → n8n → WhatsApp → Didit KYC →
  Razorpay subscription → Discord role → Zoho CRM update → AuditLog entry.
- Every process must run without a team. Ronald is solo. Automate before hiring.
- Failed payments: 3 retries over 7 days → cancellation notice (dunning workflow in n8n).

### Tech
- **Simplest architecture that works at 10,000 members.** No premature abstraction.
- **Cost-first.** Bootstrapped. Prefer free tiers and open source where reliability isn't
  compromised. Don't build what Zoho / Razorpay / n8n / Discord already provide.
- **Indian market first:** UPI-first payments, WhatsApp-first comms, Jio-speed networks,
  Aadhaar for identity. Design for these constraints, not US SaaS defaults.
- Security that matters now: Cloudflare WAF on, `maskAllInputs: true` in PostHog session
  recording, no PII in `localStorage`. Phase 2 adds Supabase RLS, JWT rotation (1h expiry),
  secrets via Doppler/Infisical (never `.env` files in repo).

### Product / positioning
- FreeYou is infrastructure, not a marketplace. Never add per-transaction fees or commissions.
- "Members first" — every product and content decision starts from member benefit.
- Bharat, not Silicon Valley: design for the actual Indian freelancer, not an MBA persona.
- Subscription price (₹1,499/month) is non-negotiable. Complaints about price = perceived value
  problem, not a pricing problem. Answer with more value, not discounts.
