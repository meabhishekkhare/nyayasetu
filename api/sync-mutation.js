// Vercel Serverless Function: POST /api/sync-mutation
// Safely merges users, cases, messages, notifications into nyayasetu_store (id=main)
// without touching adminSecurity, subscriptionRules, or payments.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
    const incoming = req.body || {};
    const r = await fetch(`${base}/rest/v1/nyayasetu_store?id=eq.main&select=payload`, { headers });
    const rows = r.ok ? await r.json() : [];
    const payload = (rows[0] && rows[0].payload) || { users: [], cases: [], messages: [], notifications: [], payments: [] };

    const mergeById = (existing = [], updates = []) => {
      const map = new Map();
      existing.forEach(item => { if (item && item.id) map.set(item.id, item); });
      updates.forEach(item => {
        if (!item || !item.id) return;
        const prev = map.get(item.id) || {};
        const merged = { ...prev, ...item };
        delete merged.photoDataUrl; // keep payload lightweight
        map.set(item.id, merged);
      });
      return Array.from(map.values());
    };

    if (Array.isArray(incoming.users)) payload.users = mergeById(payload.users, incoming.users);
    if (Array.isArray(incoming.cases)) payload.cases = mergeById(payload.cases, incoming.cases);
    if (Array.isArray(incoming.messages)) payload.messages = mergeById(payload.messages, incoming.messages);
    if (Array.isArray(incoming.notifications)) payload.notifications = mergeById(payload.notifications, incoming.notifications);

    // Strip any legacy photoDataUrl blobs to keep store fast
    if (Array.isArray(payload.users)) {
      payload.users.forEach(u => { delete u.photoDataUrl; });
    }

    const saveRes = await fetch(`${base}/rest/v1/nyayasetu_store`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ id: 'main', payload, updated_at: new Date().toISOString() })
    });
    if (!saveRes.ok) {
      return res.status(saveRes.status).json({ error: 'Failed to sync mutation' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Mutation sync failed' });
  }
};
