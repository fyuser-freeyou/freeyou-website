/**
 * FreeYou – Cloudflare Worker
 * ════════════════════════════════════════════════════════════════════
 * Routes handled:
 *   POST /api/submit-lead      → proxy form data to Zoho CRM (no CORS issues)
 *   POST /api/kyc-session      → create Didit verification session
 *   POST /api/didit-webhook    → receive Didit signed verdict
 * ════════════════════════════════════════════════════════════════════
 */

const ZOHO_TOKEN_1 = '6c74ca919f5078842bc0841aa0f62a5cd7f1b920bb5aabe520b91e58de435e12';
const ZOHO_TOKEN_2 = '9c38798e6417f2177757eff1a37f5d8728d25cd1c0cddf1518fafcec6d30e7e36246bfc22afd070763dfa2778471a10e';

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
      return handleLeadSubmit(request);
    }

    // ── Route: Create Didit KYC session ──────────────────────────────
    if (url.pathname === '/api/kyc-session' && request.method === 'POST') {
      return handleCreateSession(request, env);
    }

    // ── Route: Receive Didit webhook verdict ─────────────────────────
    if (url.pathname === '/api/didit-webhook' && request.method === 'POST') {
      return handleDigitWebhook(request, env);
    }

    return new Response('Not found', { status: 404 });
  }
};

// ═══════════════════════════════════════════════════════════════════
// SUBMIT LEAD — proxy to Zoho CRM server-side (bypasses browser CORS)
// ═══════════════════════════════════════════════════════════════════
async function handleLeadSubmit(request) {
  try {
    const data = await request.json();

    const fd = new FormData();
    fd.append('xnQsjsdp', ZOHO_TOKEN_1);
    fd.append('zc_gad', '');
    fd.append('xmIwtLD', ZOHO_TOKEN_2);
    fd.append('actionType', 'TGVhZHM=');
    fd.append('returnURL', 'null');
    fd.append('aG9uZXlwb3Q', '');
    // Map fields from request — skip internal keys (prefixed with _)
    Object.entries(data).forEach(([k, v]) => {
      if (k.startsWith('_')) return;
      if (v && String(v).trim()) fd.append(k, v);
    });
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
        vendor_data: vendor_data,           // Your internal user ID (phone+timestamp)
        callback: callback_url,             // Where Didit redirects user after verification
        prefill: {
          email: email,
          full_name: name,
          phone: phone,
        },
        // Didit will accept any Indian ID: Aadhaar, PAN, Passport, Driving Licence
        // No need to specify — the workflow configured in Didit dashboard handles this
      }),
    });

    if (!diditResp.ok) {
      const err = await diditResp.text();
      console.error('Didit session creation failed:', err);
      return jsonResponse({ error: 'Verification service unavailable' }, 502);
    }

    const session = await diditResp.json();

    // Return the hosted session URL to the frontend
    // User will be redirected here to complete ID + selfie (Didit-hosted UI)
    return jsonResponse({
      session_id: session.id,
      session_url: session.url,          // e.g. https://verify.didit.me/s/abc123
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

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    }
  });
}
