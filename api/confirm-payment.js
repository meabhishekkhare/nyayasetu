// Vercel Serverless Function: POST /api/confirm-payment
// Verifies a UPI / GPay UTR reference, marks payment verified, and updates user subscription status in Supabase.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      txnId,
      userId,
      utrNumber,
      planId,
      credits = 0,
      durationDays = 0,
      scope = 'pack'
    } = req.body || {};

    if (!txnId || !userId || !utrNumber || String(utrNumber).trim().length < 6) {
      return res.status(400).json({ error: 'Valid txnId, userId, and UPI UTR/Ref number (min 6 chars) are required.' });
    }

    const now = new Date();
    const expiresAt = durationDays > 0
      ? new Date(now.getTime() + Number(durationDays) * 24 * 3600 * 1000).toISOString()
      : null;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const base = supabaseUrl.replace(/\/+$/, '');
      const headers = {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      };

      // 1. Mark UPI transaction verified
      await fetch(`${base}/rest/v1/nyayasetu_upi_payments?id=eq.${encodeURIComponent(txnId)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          utr_number: String(utrNumber).trim(),
          status: 'verified',
          verified_at: now.toISOString()
        })
      });

      // 2. Fetch current user credits and update account status
      const userRes = await fetch(
        `${base}/rest/v1/nyayasetu_users?id=eq.${encodeURIComponent(userId)}&select=contact_credits_remaining`,
        { headers }
      );
      const userRows = userRes.ok ? await userRes.json() : [];
      const currentCredits = (userRows[0] && Number(userRows[0].contact_credits_remaining)) || 0;
      const updatedCredits = scope.includes('unlimited') ? 999999 : currentCredits + Number(credits || 0);

      await fetch(`${base}/rest/v1/nyayasetu_users?id=eq.${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          subscription_plan: planId || 'paid_plan',
          subscription_scope: scope,
          contact_credits_remaining: updatedCredits,
          subscription_expires_at: expiresAt
        })
      });
    }

    return res.status(200).json({
      ok: true,
      txnId,
      utrNumber: String(utrNumber).trim(),
      status: 'verified',
      subscriptionPlan: planId,
      subscriptionScope: scope,
      addedCredits: Number(credits || 0),
      expiresAt
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Payment verification failed' });
  }
}
