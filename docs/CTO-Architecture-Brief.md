# FreeYou — CTO Architecture Brief
**Version 1.0 | June 2026 | Confidential**

> Prepared by Ronald (Founder) for the FreeYou CTO / Lead Engineer.
> This document covers product vision, technical architecture, phase roadmap, integration map, data model, compliance requirements, and team structure.

---

## 1. What We Are Building

FreeYou is a **freelancer companion platform** for India. It is explicitly **not** a marketplace, job board, or gig platform. The distinction matters architecturally.

**Marketplace model** = match supply (freelancers) with demand (clients), charge per transaction.
**Companion model** = subscription infrastructure that serves the freelancer throughout their career lifecycle — legal tools, financial access, community, and occasionally, curated client work.

**Target user:** Indian independent professionals earning ₹30,000–₹3,00,000/month from freelance work who want to professionalize their career.

**Business model:** ₹1,499/month subscription per freelancer member. Members unlock the full platform. No per-project fee. No commission on client work (Studio model will have separate revenue share — see Phase 2).

**Legal entity:** FY Freelancing Solutions (OPC) Private Limited, Bangalore. Sole director: Ronald.

---

## 2. Product Phases

### Phase 1 — Lead Capture & Community (Now → Q3 2026)
**Goal:** Acquire first 500 paying members. Validate retention.

- Public landing page (live at freeyou.co.in)
- Lead capture form → Zoho CRM
- Manual intro call with founder → onboarding
- Membership agreement via Zoho Sign
- Razorpay UPI Autopay subscription (₹1,499/month)
- Discord community access (role assigned post-payment)
- Basic legal document templates (contract, NDA)
- Zoho Bookings for scheduling onboarding calls

**No backend required. Static site + Zoho + Razorpay + Discord = full Phase 1.**

### Phase 2 — Verification & Member Portal (Q3 2026 → Q4 2026)
**Goal:** Build trust infrastructure. Launch verified profiles and self-serve member experience.

- Aadhaar eKYC via **Didit platform** (primary) with Digio as backup
- Member web portal (authenticated, post-KYC access)
- Verified freelancer profile (public-facing badge)
- n8n automation: lead → WhatsApp → KYC → payment → activation → Discord
- Invoicing tool (create, send, track invoices)
- Contract builder (dynamic template with e-sign via Zoho Sign)
- Payment dispute workflow
- Basic dashboard: earnings, active contracts, KYC status

**Requires:** Backend API, database, auth system, KYC webhook integration.

### Phase 3 — Financial Tools & Studio (Q1 2027+)
**Goal:** Expand member LTV. Introduce revenue-generating Studio model.

- NBFC / banking partner API for credit access
- ITR filing integration (ClearTax or similar API)
- Studio — client project intake, team formation, revenue share
- Voice agent onboarding (Vapi.ai)
- City chapter management
- Analytics dashboard for members
- Mobile app (React Native)

---

## 3. Tech Stack Decisions

### Phase 1 (Current)
| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Static HTML/CSS/JS | No framework needed. Fast, Cloudflare-cacheable. |
| Hosting | Cloudflare Pages (free) | Global CDN, instant deploys, free tier covers Phase 1 |
| Analytics | PostHog (US cloud, self-hosted later) | Event tracking, session replay, free tier 1M events/month |
| Forms / CRM | Zoho CRM + Zoho Forms | Free 3-user tier, Indian data residency, full suite |
| E-sign | Zoho Sign | Integrated with CRM, legally valid in India |
| Scheduling | Zoho Bookings | Founder intro call scheduling |
| Payments | Razorpay (UPI Autopay) | Best UPI Autopay, Indian bank rails, ₹1,499 recurring |
| Community | Discord | Best community tool available, bot ecosystem |
| Version control | GitHub (fyuser-freeyou/freeyou-website) | Standard |
| DNS | Cloudflare (freeyou.co.in via BigRock registrar) | Free DNS, DDoS protection, analytics |

### Phase 2 (Portal & KYC)
| Layer | Choice | Rationale |
|---|---|---|
| Frontend framework | Next.js 14 (App Router) | SSR for SEO + SPA for portal. TypeScript. |
| Hosting (portal) | Vercel or Cloudflare Workers | Edge-first, zero cold starts |
| Database | PostgreSQL on Supabase | Managed, free tier generous, Row Level Security |
| Auth | Supabase Auth | JWT-based, OTP via SMS (Indian phone numbers), integrates with DB |
| Backend API | Next.js API routes + tRPC | Type-safe, co-located with frontend |
| KYC — Primary | **Didit platform** | UIDAI-approved, eKYC + face match + liveness, ₹15-25/verification |
| KYC — Fallback | Digio | Also UIDAI-approved, similar pricing |
| Automation | n8n (self-hosted on Hetzner/Railway) | Visual workflow builder, all integrations available |
| WhatsApp | WhatsApp Business API via Interakt | Best Indian provider, reasonable pricing |
| File storage | Cloudflare R2 | S3-compatible, no egress fees, cheap |
| Email | Resend (transactional) + Zoho Mail (team) | Resend for programmatic, Zoho for team inbox |

### Phase 3 (Scale)
| Layer | Choice |
|---|---|
| Mobile | React Native (Expo) |
| Voice onboarding | Vapi.ai |
| Search | Meilisearch (self-hosted) or Algolia |
| Background jobs | BullMQ on Redis |
| Monitoring | Sentry (errors) + PostHog (product) + Grafana (infra) |
| Payments (advanced) | Razorpay Route (marketplace payments for Studio) |

---

## 4. Critical Compliance Requirements

### Aadhaar / eKYC (MANDATORY — read before building)
- **You CANNOT store the Aadhaar number.** Ever. Not in DB, not in logs.
- You can store: verified status (boolean), KYC reference ID (from Didit/Digio), timestamp of verification, and the verified name/DOB/address returned by the provider.
- Always use an **Authentication User Agency (AUA)** — Didit and Digio are licensed. Never build your own Aadhaar integration.
- Consent must be explicit, purpose-specific, and logged before KYC initiation.
- Audit trail of all KYC initiations must be maintained.

### DPDP Act 2023 (Digital Personal Data Protection)
- Collect only what you need (data minimization). The 5-field lead form is compliant.
- Privacy Notice must be shown before data collection — link in form footer.
- Data Principal (user) rights: right to access, correct, and erase their data. Build these endpoints in Phase 2.
- Data Fiduciary obligations: maintain processing records, appoint DPO when > threshold, breach notification within 72 hours.
- Do not transfer personal data outside India without explicit consent (Cloudflare R2 is US-based — use Indian region or Backblaze B2 India for sensitive data).

### GST
- SaaS subscription = 18% GST.
- Mandatory GST registration once annual revenue > ₹20 lakhs.
- Razorpay handles GST invoice generation — configure from Day 1.

### OPC (One Person Company) Constraints
- Annual filings: MGT-7A + AOC-4 by November 30 each year.
- Cannot have more than one shareholder (Ronald) or director.
- Must convert to Pvt. Ltd. if paid-up capital > ₹50 lakhs OR turnover > ₹2 crores.
- Plan conversion to Pvt. Ltd. before hitting those thresholds — it takes 2-3 months.

---

## 5. Core Data Model (Phase 2)

```
Member
  id (UUID)
  email (unique)
  phone_whatsapp
  full_name
  skill_type (enum)
  city
  kyc_status (enum: pending | initiated | verified | failed)
  kyc_reference_id (from Didit, not Aadhaar number)
  kyc_verified_at
  kyc_verified_name
  subscription_status (enum: trial | active | paused | cancelled)
  razorpay_subscription_id
  razorpay_customer_id
  discord_user_id
  created_at
  activated_at

Lead (pre-member, pre-KYC)
  id
  name, email, phone, skill_type, city
  source (utm_source)
  status (enum: new | called | onboarding | converted | rejected)
  zoho_lead_id
  created_at

Contract
  id
  member_id (FK)
  client_name, client_email
  contract_type
  value_inr
  status (enum: draft | sent | signed | active | disputed | completed)
  zoho_sign_document_id
  created_at

Invoice
  id
  member_id (FK)
  contract_id (FK, optional)
  amount_inr, gst_amount
  status (enum: draft | sent | paid | overdue)
  due_date, paid_at

AuditLog (for compliance)
  id
  member_id, action, ip_address, user_agent, created_at
```

---

## 6. n8n Automation — Core Workflow (Phase 2)

```
TRIGGER: Zoho Form submission
  ↓
1. Create Lead in Zoho CRM
  ↓
2. Send WhatsApp welcome message (Interakt)
   "Hi {name}! Welcome to FreeYou waitlist. We'll reach out in 48h to schedule your intro call."
  ↓
3. Notify founder via WhatsApp/email (new lead alert)
  ↓
[MANUAL: Founder conducts intro call, marks CRM status → "Onboarding"]
  ↓
4. TRIGGER: CRM status change to "Onboarding"
  ↓
5. Send Zoho Sign membership agreement link via WhatsApp
  ↓
6. TRIGGER: Agreement signed (Zoho Sign webhook)
  ↓
7. Create Razorpay subscription + send payment link via WhatsApp
  ↓
8. TRIGGER: Razorpay payment.authorized webhook
  ↓
9. Initiate Didit eKYC verification link (send via WhatsApp)
  ↓
10. TRIGGER: Didit KYC verified webhook
  ↓
11. Update member status to "Active" in DB
12. Generate Discord invite with Member role
13. Send WhatsApp welcome message with Discord link + portal access
14. Create Zoho CRM contact (convert from Lead)
15. Log activation in AuditLog
```

**Error handling:** All steps have retry logic. Failed KYC sends manual review notification. Failed payment triggers dunning workflow (3 retries over 7 days → cancellation notice).

---

## 7. Integration Map

```
                    ┌─────────────────────────────────────────┐
                    │           freeyou.co.in                  │
                    │        (Cloudflare Pages)                │
                    └──────────────┬──────────────────────────┘
                                   │ Lead form submit
                    ┌──────────────▼──────────────────────────┐
                    │              n8n                         │
                    │    (Automation orchestrator)             │
                    └──┬───────┬────────┬────────┬───────────┘
                       │       │        │        │
          ┌────────────▼─┐  ┌──▼──┐  ┌──▼──┐  ┌▼──────────┐
          │  Zoho CRM    │  │ WA  │  │Didit│  │ Razorpay  │
          │  + Forms     │  │ API │  │ KYC │  │ Subscript.│
          │  + Sign      │  └─────┘  └──┬──┘  └─────┬─────┘
          │  + Bookings  │             │            │
          └──────────────┘     webhook │    webhook │
                                       │            │
                    ┌──────────────────▼────────────▼────────┐
                    │         Member Portal (Phase 2)         │
                    │     Next.js + Supabase + tRPC           │
                    └──────────────────┬──────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────┐
                    │              Discord                      │
                    │    (Community, auto role assignment)     │
                    └─────────────────────────────────────────┘
```

---

## 8. Security Architecture

### Phase 1 (Static site)
- Cloudflare WAF (free tier) on freeyou.co.in
- No server-side data → no breach surface
- PostHog with `maskAllInputs: true` in session recording
- Form data sent only to PostHog (analytics) — no PII stored client-side except `localStorage` backup

### Phase 2 (Portal)
- Supabase Row Level Security (RLS) — members can only read their own data
- JWT auth with 1-hour expiry, refresh token rotation
- All KYC reference data encrypted at rest (AES-256)
- Aadhaar number NEVER logged — middleware intercept to strip before any log sink
- HTTPS everywhere, HSTS headers, CSP headers
- Rate limiting on all API endpoints (Cloudflare + application layer)
- Separate environments: dev / staging / prod with isolated Supabase projects
- Secrets management: Doppler or Infisical (not `.env` files in repo)

---

## 9. Development Timeline

### Month 1 (Now) — Phase 1 operations, no engineering
- [x] Landing page v2 live (HTML, no framework)
- [x] PostHog analytics wired
- [x] Cloudflare Pages + custom domain
- [ ] Zoho CRM lead pipeline set up
- [ ] Razorpay test subscription configured
- [ ] Discord server structure created
- [ ] Membership agreement template in Zoho Sign

### Month 2 — Automation backbone
- [ ] n8n instance deployed (Railway or Hetzner — ~$10/month)
- [ ] WhatsApp Business API connected (Interakt)
- [ ] Core automation: form → CRM → WhatsApp → agreement → payment
- [ ] Zoho Forms embedded in landing page (replacing static HTML form)
- [ ] First 10 paying members onboarded

### Month 3-4 — Portal v1 (Phase 2 begins)
- [ ] Didit sandbox integration + test KYC flow
- [ ] Next.js portal scaffolding: auth, member profile, KYC status
- [ ] Supabase schema + RLS policies
- [ ] Razorpay subscription management in portal
- [ ] Verified profile badge (post-KYC)

### Month 5-6 — Portal v2 (Core features)
- [ ] Contract builder + Zoho Sign integration
- [ ] Invoice generator
- [ ] Dispute workflow
- [ ] Discord bot for automated role management
- [ ] Member dashboard (MRR, active contracts, invoices)

### Month 7+ — Studio & Financial (Phase 3)
- [ ] Studio project intake and team formation
- [ ] Vapi.ai voice onboarding agent
- [ ] NBFC partner API integration
- [ ] Mobile app (Expo / React Native)

---

## 10. Team Structure Recommendation

**Now (pre-revenue):**
- Founder (Ronald) — product, operations, sales, community
- No engineering hire until 100 paying members

**At 100 members (Month 3-4):**
- 1 Full-Stack Engineer (Next.js + Node + Supabase) — portal build
- 1 Part-time Designer (UI/UX for portal — can start with Figma → handoff to engineer)
- Keep ops lean: Zoho + n8n handles most workflow automation

**At 500 members (Month 6-8):**
- Add 1 Backend Engineer (specializing in integrations: Didit, Razorpay, WhatsApp)
- Add 1 Community Manager (Discord + WhatsApp)
- Consider fractional CFO for NBFC/banking partnerships

**Never hire before you need it.** The entire Phase 1-2 stack can be run by 1 good full-stack engineer + the founder.

---

## 11. Cost Model (Monthly)

| Service | Phase 1 | Phase 2 | Phase 3 |
|---|---|---|---|
| Cloudflare Pages | Free | Free | Free |
| PostHog | Free (< 1M events) | Free | ~$20/month |
| Zoho Suite | Free (3 users) | ~$30/month | ~$60/month |
| Razorpay | 2% per transaction | 2% per transaction | 2% |
| Didit KYC | — | ~₹20/member (one-time) | ~₹20/member |
| n8n (self-hosted) | — | ~₹800/month (Hetzner VPS) | ~₹800/month |
| Supabase | — | Free → $25/month | $25/month |
| WhatsApp API (Interakt) | — | ~$30/month | ~$50/month |
| Discord | Free | Free | Free |
| **Total infra** | **~₹0** | **~₹8,000/month** | **~₹15,000/month** |

**Break-even for infra costs:** 6 paying members at ₹1,499/month.

---

## 12. Key Technical Decisions for CTO to Validate

1. **Didit vs. Digio for eKYC** — Both are UIDAI-approved. Didit is newer with better UX; Digio is more established. Get quotes from both and test sandbox before committing.

2. **n8n hosting** — Railway ($5/month) is easiest to start. Migrate to Hetzner (€3.29/month) VPS when you need more control. Never use n8n cloud (too expensive for startup stage).

3. **Supabase vs. PlanetScale vs. Neon** — Supabase is recommended for its integrated auth + storage + RLS + generous free tier. PlanetScale has no RLS. Neon is pure Postgres but no batteries included.

4. **WhatsApp API provider** — Interakt, AiSensy, or WATI are the main Indian options. Interakt has the best automation builder but Aisensy is cheapest. Test both.

5. **Portal framework** — Next.js App Router is right for this. Avoid building a separate Express API — keep it monorepo with Next.js API routes until you hit traffic that requires separation.

6. **Never build a custom auth system.** Supabase Auth with OTP (Indian phone number) is the right call for Phase 2.

---

*Document owner: Ronald (Founder) | Next review: Monthly | Share with: CTO, Lead Engineer*
*Last updated: June 2026*
