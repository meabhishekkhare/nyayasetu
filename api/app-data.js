// Vercel Serverless Function: GET /api/app-data
// Public lightweight state for index.html (strips adminSecurity and photoDataUrl)

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase env vars not configured.' });
  }

  const base = supabaseUrl.replace(/\/+$/, '');
  const headers = {
    'Content-Type': 'application/json',
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`
  };

  try {
    const [mainRes, adminRes] = await Promise.all([
      fetch(`${base}/rest/v1/nyayasetu_store?id=eq.main&select=payload`, { headers }),
      fetch(`${base}/rest/v1/nyayasetu_store?id=eq.admin_settings&select=payload`, { headers })
    ]);
    const mainRows = mainRes.ok ? await mainRes.json() : [];
    const adminRows = adminRes.ok ? await adminRes.json() : [];

    const payload = (mainRows[0] && mainRows[0].payload) || {};
    const adminCfg = (adminRows[0] && adminRows[0].payload) || {};

    const users = (Array.isArray(payload.users) ? payload.users : []).map(u => {
      const copy = { ...u };
      delete copy.photoDataUrl;
      return copy;
    });

    const subscriptionRules = adminCfg.subscriptionRules || payload.subscriptionRules || {
      upiVpa: adminCfg.upiVpa || 'nyayasetu@upi',
      upiName: adminCfg.upiName || 'NyayaSetu Legal Directory',
      client: [
        { id: 'cli_single', name: 'Single Contact Unlock', priceInr: 1, credits: 1, durationDays: 0, enabled: true, description: '₹1 one-time unlock for 1 advisor contact' },
        { id: 'cli_28d_5', name: '28-Day 5 Contacts Plan', priceInr: 49, credits: 5, durationDays: 28, enabled: true, description: '₹49 for 28 days • 5 advisor contacts' },
        { id: 'cli_28d_10', name: '28-Day 10 Contacts Plan', priceInr: 99, credits: 10, durationDays: 28, enabled: true, description: '₹99 for 28 days • 10 advisor contacts' }
      ],
      advisor: [
        { id: 'adv_1m_5', name: '1-Month Starter (5 Contacts)', priceInr: 199, credits: 5, durationDays: 30, enabled: true, description: '₹199/mo • 5 client contact unlocks' },
        { id: 'adv_1m_25', name: '1-Month Growth (25 Contacts)', priceInr: 499, credits: 25, durationDays: 30, enabled: true, description: '₹499/mo • 25 client contact unlocks' },
        { id: 'adv_3m_100', name: '3-Month Pro (100 Contacts)', priceInr: 999, credits: 100, durationDays: 90, enabled: true, description: '₹999/3mo • 100 client contact unlocks' }
      ]
    };

    return res.status(200).json({
      ok: true,
      payload: {
        users,
        cases: Array.isArray(payload.cases) ? payload.cases : [],
        messages: Array.isArray(payload.messages) ? payload.messages : [],
        notifications: Array.isArray(payload.notifications) ? payload.notifications : [],
        payments: Array.isArray(payload.payments) ? payload.payments : [],
        subscriptionRules,
        upiVpa: adminCfg.upiVpa || subscriptionRules.upiVpa || 'nyayasetu@upi',
        upiName: adminCfg.upiName || subscriptionRules.upiName || 'NyayaSetu Legal Directory'
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to load app data' });
  }
};
