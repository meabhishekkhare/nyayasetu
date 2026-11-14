// Vercel Serverless Function: GET /api/get-rules?role=client|advisor
// Publicly serves active subscription rules & plans from Supabase to all users.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(200).json({ ok: false, rules: null });
  }

  const role = req.query.role ? `?role=eq.${encodeURIComponent(req.query.role)}&select=*` : '?select=*';
  const base = supabaseUrl.replace(/\/+$/, '');
  const r = await fetch(`${base}/rest/v1/nyayasetu_subscription_rules${role}`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
  });
  const rows = r.ok ? await r.json() : [];
  return res.status(200).json({ ok: true, rules: rows });
};
