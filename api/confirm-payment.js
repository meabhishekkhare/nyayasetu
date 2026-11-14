// Vercel Serverless Function: POST /api/confirm-payment
// Records the user's UPI UTR/Reference ID as 'pending' for manual Admin verification.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { txnId, userId, utrNumber } = req.body || {};

    if (!txnId || !userId || !utrNumber || String(utrNumber).trim().length < 6) {
      return res.status(400).json({ error: 'Valid txnId, userId, and UPI UTR/Ref number (min 6 chars) are required.' });
    }

    const cleanUtr = String(utrNumber).trim();
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const base = supabaseUrl.replace(/\/+$/, '');
      const headers = {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      };

      const r = await fetch(`${base}/rest/v1/nyayasetu_upi_payments?id=eq.${encodeURIComponent(txnId)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          utr_number: cleanUtr,
          status: 'pending'
        })
      });
      if (!r.ok) {
        const errData = await r.json().catch(() => ({}));
        return res.status(r.status).json({ error: errData.message || 'Failed to record UTR' });
      }
    }

    return res.status(200).json({
      ok: true,
      txnId,
      utrNumber: cleanUtr,
      status: 'pending',
      message: 'UTR submitted for admin verification.'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to submit UTR' });
  }
};
