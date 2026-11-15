// Vercel Serverless Function: POST /api/register-sync
// Persists newly registered users to Supabase nyayasetu_store so they can log in from any device.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user } = req.body || {};
  if (!user || !user.id || !user.role) {
    return res.status(400).json({ error: 'Valid user object is required.' });
  }

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
    const r = await fetch(`${base}/rest/v1/nyayasetu_store?id=eq.main&select=payload`, { headers });
    const rows = r.ok ? await r.json() : [];
    const payload = (rows[0] && rows[0].payload) || { users: [], cases: [], messages: [], payments: [] };
    if (!Array.isArray(payload.users)) payload.users = [];

    const idx = payload.users.findIndex(u => u.id === user.id);
    if (idx >= 0) payload.users[idx] = { ...payload.users[idx], ...user };
    else payload.users.push(user);

    await fetch(`${base}/rest/v1/nyayasetu_store`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ id: 'main', payload, updated_at: new Date().toISOString() })
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Register sync failed' });
  }
};
