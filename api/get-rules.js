// Vercel Serverless Function: GET /api/get-rules?role=client|advisor
// Reads live Admin edits from nyayasetu_store (payload.subscriptionRules), falling back to nyayasetu_subscription_rules.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(200).json({ ok: false, rules: null });
  }

  const base = supabaseUrl.replace(/\/+$/, '');
  const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };
  const targetRole = req.query.role;

  try {
    // 1. Check live admin-saved rules in nyayasetu_store
    const storeRes = await fetch(`${base}/rest/v1/nyayasetu_store?id=eq.main&select=payload`, { headers });
    if (storeRes.ok) {
      const storeRows = await storeRes.json();
      const subRules = storeRows[0] && storeRows[0].payload && storeRows[0].payload.subscriptionRules;
      if (subRules) {
        const roles = targetRole ? [targetRole] : ['client', 'advisor'];
        const mapped = roles
          .filter(r => subRules[r])
          .map(r => ({
            role: r,
            free_contacts: subRules[r].freeContacts,
            push_after_contacts: subRules[r].pushAfterContacts,
            plans: subRules[r].plans || []
          }));
        if (mapped.length) return res.status(200).json({ ok: true, source: 'nyayasetu_store', rules: mapped });
      }
    }

    // 2. Fallback to seeded nyayasetu_subscription_rules table
    const query = targetRole ? `?role=eq.${encodeURIComponent(targetRole)}&select=*` : '?select=*';
    const r = await fetch(`${base}/rest/v1/nyayasetu_subscription_rules${query}`, { headers });
    const rows = r.ok ? await r.json() : [];
    return res.status(200).json({ ok: true, source: 'nyayasetu_subscription_rules', rules: rows });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};
