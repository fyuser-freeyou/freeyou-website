/**
 * FreeYou – Cloudflare Worker
 * ════════════════════════════════════════════════════════════════════
 * Routes handled:
 *   POST /api/submit-lead      → proxy form data to Zoho CRM (no CORS issues)
 *   POST /api/kyc-session      → create Didit verification session
 *   POST /api/didit-webhook    → receive Didit signed verdict
 * ════════════════════════════════════════════════════════════════════
 */

// Zoho Web-to-Lead tokens now come from Worker secrets (not hardcoded).
// Set them with:
//   npx wrangler secret put ZOHO_WEBFORM_TOKEN_1
//   npx wrangler secret put ZOHO_WEBFORM_TOKEN_2
// NOTE: the previous hardcoded values were committed to git — regenerate the
// Web-to-Lead form in Zoho (Setup > Developer Space > Webforms) so the old
// tokens are invalidated, then store the new ones as secrets above.

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    // ── Route: Submit lead to Zoho CRM ───────────────────────────────
    if (url.pathname === '/api/submit-lead' && request.method === 'POST') {
      return handleLeadSubmit(request, env);
    }

    // ── Route: Create Didit KYC session ──────────────────────────────
    if (url.pathname === '/api/kyc-session' && request.method === 'POST') {
      return handleCreateSession(request, env);
    }

    // ── Route: Receive Didit webhook verdict ─────────────────────────
    if (url.pathname === '/api/didit-webhook' && request.method === 'POST') {
      return handleDigitWebhook(request, env);
    }

    // ── Route: Create Razorpay order ─────────────────────────────────
    if (url.pathname === '/api/create-order' && request.method === 'POST') {
      return handleCreateOrder(request, env);
    }

    // ── Route: Verify Razorpay payment signature ─────────────────────
    if (url.pathname === '/api/verify-payment' && request.method === 'POST') {
      return handleVerifyPayment(request, env);
    }

    // ── Route: Verify Google ID token (Sign in with Google) ──────────
    if (url.pathname === '/api/verify-google' && request.method === 'POST') {
      return handleVerifyGoogle(request, env);
    }

    // Fall back to static assets (HTML, CSS, JS, images etc.)
    return env.ASSETS.fetch(request);
  }
};

// ═══════════════════════════════════════════════════════════════════
// SUBMIT LEAD — proxy to Zoho CRM server-side (bypasses browser CORS)
// ═══════════════════════════════════════════════════════════════════
async function handleLeadSubmit(request, env) {
  try {
    const data = await request.json();

    if (!env.ZOHO_WEBFORM_TOKEN_1 || !env.ZOHO_WEBFORM_TOKEN_2) {
      console.error('handleLeadSubmit: Zoho webform tokens not configured');
      return jsonResponse({ success: false, error: 'Lead capture not configured' }, 500, {
        'Access-Control-Allow-Origin': '*',
      });
    }

    const fd = new FormData();
    fd.append('xnQsjsdp', env.ZOHO_WEBFORM_TOKEN_1);
    fd.append('zc_gad', '');
    fd.append('xmIwtLD', env.ZOHO_WEBFORM_TOKEN_2);
    fd.append('actionType', 'TGVhZHM=');
    fd.append('returnURL', 'null');
    fd.append('aG9uZXlwb3Q', '');

    // Map fields from request — skip internal keys (prefixed with _)
    // Required Zoho fields: First Name, Last Name, Email, Phone
    // Optional: Address - City, Description, Website, Lead Source
    Object.entries(data).forEach(([k, v]) => {
      if (k.startsWith('_')) return; // strip internal fields like _source_form
      if (v && String(v).trim()) fd.append(k, v);
    });

    // Default lead source if not provided
    if (!data['Lead Source']) fd.append('Lead Source', 'Web Site');

    await fetch('https://crm.zoho.in/crm/WebToLeadForm', {
      method: 'POST',
      body: fd,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (err) {
    console.error('handleLeadSubmit error:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
// 1. CREATE DIDIT SESSION
// Called by join.html Step 2 when user clicks "Start Identity Verification"
// ═══════════════════════════════════════════════════════════════════
async function handleCreateSession(request, env) {
  try {
    const body = await request.json();
    const { vendor_data, email, name, phone, callback_url, workflow_id } = body;

    // Validate required fields
    if (!vendor_data || !email || !workflow_id) {
      return jsonResponse({ error: 'Missing required fields' }, 400);
    }

    // POST to Didit Sessions API
    // Docs: https://docs.didit.me/sessions-api/create-session
    const diditResp = await fetch('https://verification.didit.me/v3/session/', {
      method: 'POST',
      headers: {
        'x-api-key': env.DIDIT_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflow_id: workflow_id,
        vendor_data: vendor_data,           // Our internal ID: fy_PHONE_TIMESTAMP
        callback: callback_url,             // Where Didit redirects after verification
        callback_method: 'both',            // Fire callback on both initiator + completer device
        language: 'en',
        contact_details: {                  // Pre-fills email/phone in Didit UI
          email: email,
          phone: phone ? `+91${phone.replace(/^\+91/, '')}` : undefined,
          send_notification_emails: false,
        },
        // Didit accepts any Indian ID: Aadhaar, PAN, Passport, Driving Licence
        // Document types controlled by the workflow configured in Didit dashboard
      }),
    });

    if (!diditResp.ok) {
      const errText = await diditResp.text();
      console.error('[FreeYou] Didit session creation failed:', diditResp.status, errText);
      return jsonResponse({ error: 'Verification service unavailable', detail: errText }, 502);
    }

    const session = await diditResp.json();
    console.log(`[FreeYou] Didit session created: ${session.session_id} status=${session.status}`);

    // Return the hosted session URL to the frontend
    // User will be redirected here to complete ID + selfie (Didit-hosted UI)
    return jsonResponse({
      session_id: session.session_id,
      session_url: session.url,            // e.g. https://verify.didit.me/session/...
    }, 201, {
      'Access-Control-Allow-Origin': '*',
    });

  } catch (err) {
    console.error('handleCreateSession error:', err);
    return jsonResponse({ error: 'Internal error' }, 500);
  }
}

// ═══════════════════════════════════════════════════════════════════
// 2. RECEIVE DIDIT WEBHOOK
// Didit POSTs here when a user completes (or fails) verification.
// We verify the HMAC signature, then update Zoho CRM.
// ═══════════════════════════════════════════════════════════════════
async function handleDigitWebhook(request, env) {
  const rawBody = await request.text();

  // ── Verify HMAC-SHA256 signature ──────────────────────────────────
  // Didit signs every webhook with X-Signature-V2 header.
  // CRITICAL: Verify before trusting the payload (prevent spoofing).
  const sigHeader = request.headers.get('X-Signature-V2');
  const isValid = await verifyHmac(rawBody, sigHeader, env.DIDIT_WEBHOOK_SECRET);

  if (!isValid) {
    console.error('Didit webhook: invalid HMAC signature');
    return new Response('Unauthorized', { status: 401 });
  }

  // ── Parse payload ─────────────────────────────────────────────────
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  const {
    session_id,
    vendor_data,   // our fy_PHONE_TIMESTAMP string
    status,        // "Approved" | "Declined" | "In Review" | "Kyc Expired" | "Abandoned"
    id_verification,
    liveness,
    face,
  } = payload;

  console.log(`[FreeYou] Didit webhook: session=${session_id} status=${status} vendor=${vendor_data}`);

  // ── Update Zoho CRM ───────────────────────────────────────────────
  // Extract phone from vendor_data (format: fy_PHONE_TIMESTAMP)
  const phonePart = (vendor_data || '').split('_')[1] || '';

  if (status === 'Approved') {
    // Mark member as KYC-verified in Zoho CRM
    // We do NOT store document data — only verification status
    await updateZohoCRM(env, {
      phone: phonePart,
      kyc_status: 'Verified',
      kyc_provider: 'Didit',
      kyc_session_id: session_id,
      kyc_verified_at: new Date().toISOString(),
      // DPDP Act compliance: no Aadhaar/PAN/passport data stored
    });
  } else if (status === 'Declined') {
    await updateZohoCRM(env, {
      phone: phonePart,
      kyc_status: 'Failed',
      kyc_provider: 'Didit',
      kyc_session_id: session_id,
    });
  }
  // "In Review" — leave CRM as-is, ops team handles manually

  // Acknowledge receipt within 5 seconds (Didit requirement)
  return new Response('OK', { status: 200 });
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

// Verify X-Signature-V2 = HMAC-SHA256(rawBody, webhookSecret)
async function verifyHmac(body, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const computed = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    // Didit sends "sha256=XXXX" or just "XXXX"
    const received = signatureHeader.replace('sha256=', '');
    return computed === received;
  } catch {
    return false;
  }
}

// Update a Zoho CRM Lead/Contact with KYC status
// Uses Zoho CRM v2 API. Finds contact by phone, updates custom fields.
async function updateZohoCRM(env, data) {
  try {
    // Get Zoho access token from refresh token
    const tokenResp = await fetch('https://accounts.zoho.in/oauth/v2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: env.ZOHO_REFRESH_TOKEN,
        client_id: env.ZOHO_CLIENT_ID,
        client_secret: env.ZOHO_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    });
    const { access_token } = await tokenResp.json();

    // Search for the lead/contact by phone number
    const searchResp = await fetch(
      `https://www.zohoapis.in/crm/v2/Leads/search?criteria=(Phone:equals:${data.phone})`,
      { headers: { 'Authorization': `Zoho-oauthtoken ${access_token}` } }
    );
    const searchData = await searchResp.json();
    const lead = searchData?.data?.[0];

    if (!lead) {
      console.warn(`[FreeYou] Zoho CRM: no lead found for phone ${data.phone}`);
      return;
    }

    // Update the lead with KYC fields
    // These field names must match your Zoho CRM custom field API names
    // (CRM > Setup > Modules > Leads > Fields > each field has an API Name)
    await fetch(`https://www.zohoapis.in/crm/v2/Leads/${lead.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Zoho-oauthtoken ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [{
          KYC_Status: data.kyc_status,             // Custom field: "KYC Status" (Picklist)
          KYC_Provider: data.kyc_provider,          // Custom field: "KYC Provider" (Text)
          KYC_Session_ID: data.kyc_session_id,      // Custom field: "KYC Session ID" (Text)
          KYC_Verified_At: data.kyc_verified_at,    // Custom field: "KYC Verified At" (DateTime)
          Lead_Status: data.kyc_status === 'Verified' ? 'Qualified' : 'Contacted',
        }]
      }),
    });

    console.log(`[FreeYou] Zoho CRM updated: phone=${data.phone} kyc=${data.kyc_status}`);

  } catch (err) {
    // Don't fail the webhook response — log and move on
    console.error('[FreeYou] Zoho CRM update failed:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════
// GOOGLE — VERIFY ID TOKEN (Sign in with Google)
// The frontend sends the GIS credential (a signed JWT). We validate it
// with Google's tokeninfo endpoint (checks signature + expiry), then
// confirm the audience matches our own OAuth Client ID before trusting
// the email. Prevents anyone forging a JWT to fake a Google identity.
// Requires Worker secret/var: GOOGLE_CLIENT_ID
// ═══════════════════════════════════════════════════════════════════
async function handleVerifyGoogle(request, env) {
  const cors = { 'Access-Control-Allow-Origin': '*' };
  try {
    const { credential } = await request.json();
    if (!credential) return jsonResponse({ verified: false, error: 'Missing credential' }, 400, cors);
    if (!env.GOOGLE_CLIENT_ID) {
      console.error('handleVerifyGoogle: GOOGLE_CLIENT_ID not configured');
      return jsonResponse({ verified: false, error: 'Google auth not configured' }, 500, cors);
    }

    const resp = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    if (!resp.ok) return jsonResponse({ verified: false, error: 'Invalid token' }, 401, cors);
    const p = await resp.json();

    const now = Math.floor(Date.now() / 1000);
    const okAud = p.aud === env.GOOGLE_CLIENT_ID;
    const okIss = p.iss === 'accounts.google.com' || p.iss === 'https://accounts.google.com';
    const okExp = Number(p.exp) > now;
    const okEmail = p.email_verified === true || p.email_verified === 'true';

    if (!okAud || !okIss || !okExp || !okEmail) {
      console.error('[FreeYou] Google token validation failed', { okAud, okIss, okExp, okEmail });
      return jsonResponse({ verified: false, error: 'Token validation failed' }, 401, cors);
    }

    return jsonResponse({
      verified: true,
      email: p.email,
      given_name: p.given_name || '',
      family_name: p.family_name || '',
      sub: p.sub,
    }, 200, cors);

  } catch (err) {
    console.error('[FreeYou] handleVerifyGoogle error:', err);
    return jsonResponse({ verified: false, error: 'Internal error' }, 500, cors);
  }
}

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    }
  });
}

// ═══════════════════════════════════════════════════════════════════
// RAZORPAY — CREATE ORDER
// Called by join.html Step 3 before opening the payment modal.
// Amount is in paise (₹1,499 = 149900 paise).
// Uses env.RAZORPAY_KEY_ID + env.RAZORPAY_KEY_SECRET (Worker secrets).
// ═══════════════════════════════════════════════════════════════════
async function handleCreateOrder(request, env) {
  try {
    const body = await request.json();
    const { amount, currency = 'INR', receipt, notes } = body;

    if (!amount || Number(amount) < 100) {
      return jsonResponse({ error: 'Amount must be at least 100 paise (₹1)' }, 400);
    }

    // Razorpay REST API — Basic Auth with key_id:key_secret
    const auth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);

    const rzpResp = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Number(amount),
        currency,
        receipt: receipt || `fy_${Date.now()}`,
        notes: notes || {},
      }),
    });

    if (!rzpResp.ok) {
      const err = await rzpResp.text();
      console.error('[FreeYou] Razorpay create order failed:', err);
      return jsonResponse({ error: 'Order creation failed' }, 502);
    }

    const order = await rzpResp.json();

    return jsonResponse(
      { order_id: order.id, amount: order.amount, currency: order.currency },
      201,
      { 'Access-Control-Allow-Origin': '*' }
    );

  } catch (err) {
    console.error('[FreeYou] handleCreateOrder error:', err);
    return jsonResponse({ error: 'Internal error' }, 500);
  }
}

// ═══════════════════════════════════════════════════════════════════
// RAZORPAY — VERIFY PAYMENT SIGNATURE
// Called after the Razorpay modal succeeds.
// Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
// ═══════════════════════════════════════════════════════════════════
async function handleVerifyPayment(request, env) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return jsonResponse({ error: 'Missing required fields' }, 400);
    }

    const message = `${razorpay_order_id}|${razorpay_payment_id}`;
    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(env.RAZORPAY_KEY_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
    const computed = Array.from(new Uint8Array(sigBuffer))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    if (computed !== razorpay_signature) {
      console.error('[FreeYou] Razorpay signature mismatch');
      return jsonResponse({ verified: false, error: 'Signature mismatch' }, 400);
    }

    console.log(`[FreeYou] Payment verified: order=${razorpay_order_id} payment=${razorpay_payment_id}`);

    return jsonResponse(
      { verified: true, payment_id: razorpay_payment_id, order_id: razorpay_order_id },
      200,
      { 'Access-Control-Allow-Origin': '*' }
    );

  } catch (err) {
    console.error('[FreeYou] handleVerifyPayment error:', err);
    return jsonResponse({ error: 'Internal error' }, 500);
  }
}
