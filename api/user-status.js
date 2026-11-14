// Vercel Serverless Function: GET /api/user-status?userId=...
// Returns live subscription status & credits for a user from nyayasetu_users.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const userId = (req.query && req.query.userId) || '';
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase env vars not configured on Vercel.' });
  }

  const base = supabaseUrl.replace(/\/+$/, '');
  try {
    const r = await fetch(
      `${base}/rest/v1/nyayasetu_users?id=eq.${encodeURIComponent(userId)}&select=id,subscription_plan,subscription_scope,contact_credits_remaining,subscription_expires_at`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`
        }
      }
    );
    const rows = await r.json();
    const user = Array.isArray(rows) ? rows[0] : null;
    return res.status(200).json({ ok: true, user });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch user status' });
  }
};
