export async function onRequestPost(context) {
  const ZOHO_TOKEN_1 = '6c74ca919f5078842bc0841aa0f62a5cd7f1b920bb5aabe520b91e58de435e12';
  const ZOHO_TOKEN_2 = '9c38798e6417f2177757eff1a37f5d8728d25cd1c0cddf1518fafcec6d30e7e36246bfc22afd070763dfa2778471a10e';

  try {
    const data = await context.request.json();

    const fd = new FormData();
    fd.append('xnQsjsdp', ZOHO_TOKEN_1);
    fd.append('zc_gad', '');
    fd.append('xmIwtLD', ZOHO_TOKEN_2);
    fd.append('actionType', 'TGVhZHM=');
    fd.append('returnURL', 'null');
    fd.append('aG9uZXlwb3Q', '');

    Object.entries(data).forEach(([k, v]) => {
      if (k.startsWith('_')) return;
      if (v && String(v).trim()) fd.append(k, v);
    });
    if (!data['Lead Source']) fd.append('Lead Source', 'Web Site');

    await fetch('https://crm.zoho.in/crm/WebToLeadForm', { method: 'POST', body: fd });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}