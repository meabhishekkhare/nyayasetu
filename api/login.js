// Vercel Serverless Function: POST /api/login
// Authenticates users across devices via Supabase (nyayasetu_store + nyayasetu_users).

function normPhone(v) {
  return String(v || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { ident, password, role } = req.body || {};
  const cleanIdent = String(ident || '').trim().toLowerCase();
  const cleanPhone = normPhone(cleanIdent);
  const pwd = String(password || '');

  if (!cleanIdent || !pwd || !role) {
    return res.status(400).json({ error: 'Email/phone, password, and role are required.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase env vars not configured on Vercel.' });
  }

  const base = supabaseUrl.replace(/\/+$/, '');
  const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

  try {
    // 1. Check nyayasetu_store (main payload.users)
    const storeRes = await fetch(`${base}/rest/v1/nyayasetu_store?id=eq.main&select=payload`, { headers });
    if (storeRes.ok) {
      const rows = await storeRes.json();
      const users = (rows[0] && rows[0].payload && Array.isArray(rows[0].payload.users))
        ? rows[0].payload.users
        : [];
      const match = users.find(u => {
        if (u.role !== role) return false;
        const emailMatch = (u.email || '').trim().toLowerCase() === cleanIdent;
        const phoneMatch = cleanPhone && normPhone(u.phone) === cleanPhone;
        return (emailMatch || phoneMatch) && u.password === pwd;
      });
      if (match) {
        return res.status(200).json({ ok: true, user: match });
      }
    }

    // 2. Fallback check nyayasetu_users table
    const usersRes = await fetch(
      `${base}/rest/v1/nyayasetu_users?role=eq.${encodeURIComponent(role)}&select=*`,
      { headers }
    );
    if (usersRes.ok) {
      const rows = await usersRes.json();
      const match = (Array.isArray(rows) ? rows : []).find(u => {
        const emailMatch = (u.email || '').trim().toLowerCase() === cleanIdent;
        const phoneMatch = cleanPhone && normPhone(u.phone) === cleanPhone;
        const passMatch = (u.password || u.password_hash) === pwd;
        return (emailMatch || phoneMatch) && passMatch;
      });
      if (match) {
        return res.status(200).json({
          ok: true,
          user: {
            id: match.id,
            role: match.role,
            name: match.name || match.full_name || 'User',
            email: match.email || '',
            phone: match.phone || '',
            password: pwd,
            subscriptionPlan: match.subscription_plan || 'free_starter',
            subscriptionScope: match.subscription_scope || '',
            contactCreditsRemaining: match.contact_credits_remaining || 0,
            subscriptionExpiresAt: match.subscription_expires_at || null
          }
        });
      }
    }

    return res.status(401).json({ error: 'Invalid credentials for selected role' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
};
