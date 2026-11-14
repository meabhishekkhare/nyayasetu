// Vercel Serverless Function: GET/POST /api/admin-verify-payment
// Lists UPI payments and lets Admin manually Approve (verify + activate plan) or Reject by UTR/txnId.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase env vars not configured on Vercel.' });
  }

  const base = supabaseUrl.replace(/\/+$/, '');
  const headers = {
    'Content-Type': 'application/json',
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`
  };

  try {
    if (req.method === 'GET') {
      const r = await fetch(`${base}/rest/v1/nyayasetu_upi_payments?select=*&order=created_at.desc&limit=100`, { headers });
      const rows = await r.json();
      return res.status(r.ok ? 200 : 400).json({ ok: r.ok, payments: Array.isArray(rows) ? rows : [] });
    }

    if (req.method === 'POST') {
      const { txnId, action, utrNumber } = req.body || {};
      if (!txnId || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'txnId and action (approve|reject) are required.' });
      }

      const pRes = await fetch(`${base}/rest/v1/nyayasetu_upi_payments?id=eq.${encodeURIComponent(txnId)}&select=*`, { headers });
      const pRows = await pRes.json();
      const payment = pRows && pRows[0];
      if (!payment) return res.status(404).json({ error: 'Payment transaction not found.' });

      const nowIso = new Date().toISOString();
      const newStatus = action === 'approve' ? 'verified' : 'failed';

      await fetch(`${base}/rest/v1/nyayasetu_upi_payments?id=eq.${encodeURIComponent(txnId)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status: newStatus,
          utr_number: utrNumber ? String(utrNumber).trim() : payment.utr_number,
          verified_at: action === 'approve' ? nowIso : null
        })
      });

      if (action === 'approve') {
        const rulesRes = await fetch(`${base}/rest/v1/nyayasetu_subscription_rules?role=eq.${encodeURIComponent(payment.user_role)}&select=plans`, { headers });
        const rulesRows = rulesRes.ok ? await rulesRes.json() : [];
        const plans = (rulesRows[0] && rulesRows[0].plans) || [];
        const plan = plans.find(p => p.id === payment.plan_id) || {};
        const credits = Number(plan.credits || 0);
        const durationDays = Number(plan.durationDays || 0);
        const scope = plan.scope || 'pack';
        const expiresAt = durationDays > 0 ? new Date(Date.now() + durationDays * 86400000).toISOString() : null;

        const uRes = await fetch(`${base}/rest/v1/nyayasetu_users?id=eq.${encodeURIComponent(payment.user_id)}&select=contact_credits_remaining`, { headers });
        const uRows = uRes.ok ? await uRes.json() : [];
        const currCredits = (uRows[0] && Number(uRows[0].contact_credits_remaining)) || 0;
        const updatedCredits = scope.includes('unlimited') ? 999999 : currCredits + credits;

        await fetch(`${base}/rest/v1/nyayasetu_users?id=eq.${encodeURIComponent(payment.user_id)}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            subscription_plan: payment.plan_id,
            subscription_scope: scope,
            contact_credits_remaining: updatedCredits,
            subscription_expires_at: expiresAt
          })
        });
      }

      return res.status(200).json({ ok: true, txnId, status: newStatus });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Admin verification failed' });
  }
};
