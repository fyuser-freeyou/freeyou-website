# FreeYou — Go-Live Checklist

A step-by-step runbook to take the site from "scaffolded" to "live and accepting real members."
Work top to bottom. Anything marked **YOU** needs a login to an external dashboard that Claude can't access.

**Stack:** Cloudflare Pages (advanced mode, single `_worker.js`) + static HTML, auto-deployed from GitHub
(`github.com/fyuser-freeyou/freeyou-website`). Secrets live in the Cloudflare Pages dashboard.

---

## 0. Security first — do these before anything else

- [ ] **Revoke the exposed GitHub token.** A Personal Access Token (`ghp_…`) is sitting in plaintext in
      `.git/config`. Revoke it at **GitHub → Settings → Developer settings → Personal access tokens**,
      then re-point the remote without embedding a token:
      ```bash
      git remote set-url origin https://github.com/fyuser-freeyou/freeyou-website.git
      # then authenticate via GitHub CLI (`gh auth login`) or an SSH remote
      ```
- [ ] **Rotate the Zoho Web-to-Lead tokens.** The old `xnQsjsdp` / `xmIwtLD` values were committed to git,
      so treat them as compromised. In **Zoho CRM → Setup → Developer Space → Webforms**, regenerate the
      lead webform, copy the two new tokens, and store them as secrets (step 4 below). The worker now reads
      them from `ZOHO_WEBFORM_TOKEN_1` / `ZOHO_WEBFORM_TOKEN_2` — they are no longer in the code.
- [ ] **Confirm `.env` is git-ignored.** It is (`.gitignore` lists `.env`). Never commit real keys.

---

## 1. Google Sign-In  **(YOU + Claude)**

The front-end and a server-side token verifier (`/api/verify-google`) are already built. You only need a
Client ID.

- [ ] **Create an OAuth 2.0 Client ID** at **console.cloud.google.com → APIs & Services → Credentials →
      Create Credentials → OAuth client ID → Web application**.
- [ ] **Authorized JavaScript origins:**
      - `https://freeyou.co.in`
      - `https://www.freeyou.co.in` (if you use www)
      - `http://localhost:8788` (only if you test locally with `wrangler pages dev`)
- [ ] No redirect URI is needed (Google Identity Services uses the JS origin only).
- [ ] Copy the Client ID (`…apps.googleusercontent.com`).
- [ ] **Paste it in two places** (they must match):
      1. `join.html` → `CONFIG.GOOGLE_CLIENT_ID`  ← Claude can do this the moment you share the ID
      2. Cloudflare Pages env var **`GOOGLE_CLIENT_ID`** (step 4) — the worker checks the token's audience
         against this, so it must be identical.
- [ ] Verify: on the live site, the real Google button renders (not the grey "not configured" fallback),
      and signing in advances to the profile step.

---

## 2. Razorpay payments  **(YOU)**

The worker already creates orders and verifies signatures. Currently in **test mode**
(`rzp_test_T5p3wt5OuBT6H4`).

- [ ] Complete Razorpay **KYC / business activation** so the account can accept live payments.
- [ ] In **Razorpay Dashboard → Settings → API Keys → Generate Live Keys**, copy the **live** Key ID
      (`rzp_live_…`) and Key Secret.
- [ ] Update `join.html` → `CONFIG.RAZORPAY_KEY_ID` to the **live** Key ID (this one is public/safe in code).
- [ ] Store the secret as Cloudflare env var **`RAZORPAY_KEY_SECRET`** (step 4). **Never** put the secret in
      any HTML/JS file.
- [ ] Also set **`RAZORPAY_KEY_ID`** as an env var (the worker uses it to create orders).
- [ ] Confirm the price. The flow charges the **Companion** plan — verify the amount in `join.html`
      (`amount` in paise; ₹1,499 = `149900`).
- [ ] Test one live ₹1 payment end-to-end, then refund it.

---

## 3. Didit KYC  **(YOU)**

Worker routes (`/api/kyc-session`, `/api/didit-webhook`) and the HMAC verification are built. Workflow ID
`c7a05647-…` is already in `join.html`.

- [ ] In the **Didit dashboard**, grab your **production API key** and the **webhook signing secret**.
- [ ] Set the webhook URL to **`https://freeyou.co.in/api/didit-webhook`**.
- [ ] Confirm the workflow accepts the Indian IDs you want (Aadhaar, PAN, Passport, DL).
- [ ] Store as Cloudflare env vars (step 4): **`DIDIT_API_KEY`**, **`DIDIT_WEBHOOK_SECRET`**.
- [ ] Test: start verification from `join.html`, complete it, and confirm the webhook flips the lead to
      `KYC_Status = Verified` in Zoho.

---

## 4. Set all secrets in Cloudflare  **(YOU)**

**Easiest:** Cloudflare dashboard → **Workers & Pages → your Pages project → Settings → Variables and
Secrets → Production**. Add each as an **encrypted secret** (except `GOOGLE_CLIENT_ID` and `RAZORPAY_KEY_ID`,
which can be plain vars). Then **redeploy** so they take effect.

Full list the worker expects:

| Name | Type | Where it comes from |
|------|------|--------------------|
| `GOOGLE_CLIENT_ID` | var | Step 1 |
| `RAZORPAY_KEY_ID` | var | Step 2 (live) |
| `RAZORPAY_KEY_SECRET` | secret | Step 2 (live) |
| `DIDIT_API_KEY` | secret | Step 3 |
| `DIDIT_WEBHOOK_SECRET` | secret | Step 3 |
| `ZOHO_WEBFORM_TOKEN_1` | secret | Step 0 (regenerated) |
| `ZOHO_WEBFORM_TOKEN_2` | secret | Step 0 (regenerated) |
| `ZOHO_REFRESH_TOKEN` | secret | Zoho API console |
| `ZOHO_CLIENT_ID` | secret | Zoho API console |
| `ZOHO_CLIENT_SECRET` | secret | Zoho API console |

CLI alternative (if you prefer): `npx wrangler pages secret put DIDIT_API_KEY --project-name <your-project>`

---

## 5. Zoho CRM field check  **(YOU)**

The webhook writes these custom fields on the Lead — they must exist with these exact API names
(CRM → Setup → Modules → Leads → Fields):

- [ ] `KYC_Status` (picklist: Verified / Failed / …)
- [ ] `KYC_Provider` (text)
- [ ] `KYC_Session_ID` (text)
- [ ] `KYC_Verified_At` (datetime)

---

## 6. Deploy  **(YOU)**

Because Pages is wired to GitHub, deploying is just pushing:

```bash
git add -A
git commit -m "Redesign site + finish auth/secret hardening"
git push origin main        # Cloudflare Pages auto-builds & deploys
```

- [ ] Watch the build in **Cloudflare → your Pages project → Deployments**.
- [ ] Confirm the custom domain `freeyou.co.in` points to the latest deployment.

---

## 7. Post-deploy smoke test  **(YOU)**

- [ ] Home, Resources, and the new article load with the new design; nav/footer consistent.
- [ ] `join.html`: Google button renders → sign in → profile step.
- [ ] KYC: start Didit → complete → Zoho lead shows `Verified`.
- [ ] Payment: one live ₹1 order → success → `/api/verify-payment` returns `verified: true` → refund it.
- [ ] Lead form: submit → new Lead appears in Zoho.
- [ ] Update `CONFIG.DISCORD_INVITE_URL` in `join.html` (still a `TODO`).
- [ ] PostHog: events (`auth_google`, `cta_*`) appear in your project.

---

## What is deliberately NOT live yet

Keep the honest framing from the site — don't flip these "on" until they're real:

- **Group health insurance** — still "In progress" on the site. Don't advertise a number until the policy
  and pricing are signed.
- **Financial tools** — same.

---

### Division of labor
- **Claude can do now:** paste your Google Client ID into `join.html`, set the live Razorpay Key ID, update
  the Discord URL, migrate `join.html`/legal pages to the new design, adjust copy.
- **Only you can do:** create the Google OAuth client, activate Razorpay live keys, get Didit production
  keys, set Cloudflare secrets, revoke the GitHub/Zoho credentials, and run the deploy.
