// Vercel Serverless Function: POST /api/save-rules
// Saves Admin subscription rules directly to nyayasetu_subscription_rules using Service Role Key.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase env vars not configured on Vercel.' });
  }

  const { role, freeContacts, pushAfterContacts, plans } = req.body || {};
  if (!['client', 'advisor'].includes(role) || !Array.isArray(plans)) {
    return res.status(400).json({ error: 'Valid role and plans array are required.' });
  }

  const base = supabaseUrl.replace(/\/+$/, '');
  const r = await fetch(`${base}/rest/v1/nyayasetu_subscription_rules?on_conflict=role`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify({
      role,
      free_contacts: Number(freeContacts ?? 3),
      push_after_contacts: Number(pushAfterContacts ?? 2),
      plans,
      updated_at: new Date().toISOString()
    })
  });

  const data = await r.json();
  if (!r.ok) return res.status(r.status).json({ error: data.message || 'Failed to save rules' });
  return res.status(200).json({ ok: true, saved: data });
};
