// Vercel Serverless Function: GET & POST /api/admin-db
// Syncs full nyayasetu_store + nyayasetu_users for admin.html without requiring browser-side Supabase keys.

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
      const storeRes = await fetch(`${base}/rest/v1/nyayasetu_store?id=eq.main&select=payload`, { headers });
      const storeRows = storeRes.ok ? await storeRes.json() : [];
      const payload = (storeRows[0] && storeRows[0].payload) || { users: [], cases: [], messages: [], payments: [] };
      if (!Array.isArray(payload.users)) payload.users = [];

      // Merge any rows from nyayasetu_users that might not be in payload.users
      const usersRes = await fetch(`${base}/rest/v1/nyayasetu_users?select=*`, { headers });
      if (usersRes.ok) {
        const uRows = await usersRes.json();
        if (Array.isArray(uRows)) {
          uRows.forEach(r => {
            const existing = payload.users.find(u => u.id === r.id);
            if (!existing) {
              payload.users.push({
                id: r.id,
                role: r.role || 'client',
                name: r.name || 'User',
                email: r.email || '',
                phone: r.phone || '',
                password: r.password || '',
                verified: r.role === 'advisor' ? false : true,
                subscriptionPlan: r.subscription_plan || 'free_starter',
                subscriptionScope: r.subscription_scope || '',
                contactCreditsRemaining: r.contact_credits_remaining || 0,
                subscriptionExpiresAt: r.subscription_expires_at || null
              });
            }
          });
        }
      }

      return res.status(200).json({ ok: true, payload });
    }

    if (req.method === 'POST') {
      const { payload } = req.body || {};
      if (!payload || !Array.isArray(payload.users)) {
        return res.status(400).json({ error: 'Valid payload object is required.' });
      }
      const r = await fetch(`${base}/rest/v1/nyayasetu_store`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({ id: 'main', payload, updated_at: new Date().toISOString() })
      });
      if (!r.ok) {
        return res.status(r.status).json({ error: 'Failed to save payload to Supabase' });
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Admin DB sync failed' });
  }
};
