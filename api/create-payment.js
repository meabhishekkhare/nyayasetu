// Vercel Serverless Function: POST /api/create-payment
// Generates a UPI / Google Pay (GPay) payment link and records a pending transaction in Supabase.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      userId,
      userRole,
      userName,
      planId,
      planName,
      amountInr,
      paymentMode = 'GPay / UPI',
      merchantVpa = process.env.NYAYASETU_UPI_VPA || 'nyayasetu@okicici',
      merchantName = process.env.NYAYASETU_UPI_NAME || 'NyayaSetu Legal'
    } = req.body || {};

    if (!userId || !planId || !amountInr) {
      return res.status(400).json({ error: 'Missing required fields: userId, planId, amountInr' });
    }

    const txnId = `NS${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
    const note = `NyayaSetu ${planName || planId} (${userName || userId})`.slice(0, 50);

    const params = new URLSearchParams({
      pa: merchantVpa,
      pn: merchantName,
      tr: txnId,
      tn: note,
      am: String(Number(amountInr).toFixed(2)),
      cu: 'INR'
    });

    const upiLink = `upi://pay?${params.toString()}`;
    const gpayLink = `tez://upi/pay?${params.toString()}`;

    // Persist pending transaction in Supabase if configured
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const base = supabaseUrl.replace(/\/+$/, '');
      await fetch(`${base}/rest/v1/nyayasetu_upi_payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({
          id: txnId,
          user_id: userId,
          user_role: userRole || 'client',
          plan_id: planId,
          plan_name: planName || planId,
          amount_inr: Number(amountInr),
          payment_mode: paymentMode,
          merchant_vpa: merchantVpa,
          upi_link: upiLink,
          gpay_link: gpayLink,
          status: 'pending'
        })
      });
    }

    return res.status(200).json({
      ok: true,
      txnId,
      amountInr: Number(amountInr),
      merchantVpa,
      upiLink,
      gpayLink,
      status: 'pending'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to create payment link' });
  }
}
