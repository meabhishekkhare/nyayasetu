let db = { users: [], cases: [], messages: [], notifications: [], payments: [], subscriptionRules: null, upiVpa: 'nyayasetu@upi', upiName: 'NyayaSetu Legal Directory' };
let session = { userId: sessionStorage.getItem('nyaya_uid') || null, authRole: 'client', activeCaseId: null, gps: null, selectedPlan: null, lang: localStorage.getItem('nyaya_lang') || 'en' };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const initials = n => (n || 'U').trim().split(/\s+/).slice(0,2).map(x => x[0]?.toUpperCase() || '').join('') || 'U';
function toast(m) { const t = document.getElementById('toast'); t.textContent = m; t.classList.remove('hidden'); setTimeout(() => t.classList.add('hidden'), 3200); }

async function loadCloud() {
  const r = await fetch('/api/app-data?t=' + Date.now());
  const d = await r.json();
  if (d && d.payload) db = d.payload;
}

async function syncCloud(partial) {
  const r = await fetch('/api/sync-mutation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(partial) });
  if (!r.ok) throw new Error('Cloud sync failed');
  await loadCloud();
}

function curUser() { return (db.users || []).find(u => u.id === session.userId) || null; }

function populateLanguages() {
  const sel = document.getElementById('lang-select');
  sel.innerHTML = (window.NYAYA_LANGUAGES || []).map(l => `<option value="${l.code}">${l.label}</option>`).join('');
  sel.value = session.lang;
  applyLanguage(session.lang);
}

function applyLanguage(code) {
  session.lang = code; localStorage.setItem('nyaya_lang', code);
  const t = (window.NYAYA_I18N && window.NYAYA_I18N[code]) || window.NYAYA_I18N.en;
  document.getElementById('hdr-tagline').textContent = t.tagline;
  document.getElementById('wlc-title').textContent = t.welcomeTitle;
  document.getElementById('wlc-sub').textContent = t.welcomeSub;
  document.getElementById('lbl-new-case').textContent = t.newCase;
  document.getElementById('lbl-case-pool').textContent = t.casePool;
}

function populateStatesAndCities(stateId, cityId, preState, preCity) {
  const stEl = document.getElementById(stateId), ctEl = document.getElementById(cityId);
  const states = Object.keys(window.NYAYA_STATES || {});
  stEl.innerHTML = states.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
  if (preState && states.includes(preState)) stEl.value = preState;
  const updateCities = (targetCity) => {
    const cities = (window.NYAYA_STATES[stEl.value] || []).slice();
    if (targetCity && !cities.includes(targetCity)) cities.unshift(targetCity);
    ctEl.innerHTML = cities.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
    if (targetCity) ctEl.value = targetCity;
  };
  stEl.onchange = () => updateCities();
  updateCities(preCity);
}

async function lookupPin(pin, stateId, cityId) {
  if (!/^\d{6}$/.test(pin)) return;
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    const data = await res.json();
    const po = data?.[0]?.PostOffice?.[0];
    if (po && po.State) {
      const stEl = document.getElementById(stateId), ctEl = document.getElementById(cityId);
      if (![...stEl.options].some(o => o.value === po.State)) stEl.add(new Option(po.State, po.State));
      stEl.value = po.State;
      const dist = po.District || po.Block || po.Name;
      const cities = (window.NYAYA_STATES[po.State] || []).slice();
      if (dist && !cities.includes(dist)) cities.unshift(dist);
      ctEl.innerHTML = cities.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
      if (dist) ctEl.value = dist;
      toast(`PIN ${pin}: ${dist}, ${po.State}`);
    }
  } catch {}
}

function populateCaseTaxonomy() {
  const pEl = document.getElementById('case-primary'), sEl = document.getElementById('case-secondary');
  const tax = window.NYAYA_CASE_TAXONOMY || {};
  pEl.innerHTML = Object.keys(tax).map(k => `<option value="${esc(k)}">${esc(k)}</option>`).join('');
  const syncSub = () => {
    const item = tax[pEl.value] || { sub: [], law: '', type: '' };
    if (!sEl.value || !item.sub.includes(sEl.value)) sEl.innerHTML = item.sub.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join('');
    document.getElementById('legal-suggest-type').textContent = `Case Type: ${item.type} (${sEl.value || pEl.value})`;
    document.getElementById('legal-suggest-law').textContent = `Applicable Acts & Law: ${item.law}`;
    updateLivePreview();
  };
  pEl.onchange = () => { sEl.innerHTML = (tax[pEl.value]?.sub || []).map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join(''); syncSub(); };
  sEl.onchange = syncSub;
  syncSub();
}

function showWelcome() {
  ['win-auth', 'win-client', 'win-advisor'].forEach(id => document.getElementById(id).classList.add('hidden'));
  document.getElementById('win-welcome').classList.remove('hidden');
  document.getElementById('btn-logout').classList.add('hidden');
  document.getElementById('hdr-badge').classList.add('hidden');
}

function enterAuthFromWelcome(role) {
  document.getElementById('win-welcome').classList.add('hidden');
  document.getElementById('win-auth').classList.remove('hidden');
  setAuthRole(role);
}

function setAuthRole(role) {
  session.authRole = role;
  const isAdv = role === 'advisor';
  document.getElementById('role-tab-client').className = !isAdv ? 'role-btn py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#08519C] text-white' : 'role-btn py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-transparent text-[#08306B]';
  document.getElementById('role-tab-advisor').className = isAdv ? 'role-btn py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#08519C] text-white' : 'role-btn py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-transparent text-[#08306B]';
  document.getElementById('auth-signin-title').textContent = isAdv ? 'Sign In as Advisor / Legal Firm' : 'Sign In as Requestee';
  document.getElementById('reg-role').value = isAdv ? 'advisor' : 'client';
  toggleRegAdvisorFields();
}

function toggleRegAdvisorFields() {
  const v = document.getElementById('reg-role').value;
  document.getElementById('reg-advisor-fields').classList.toggle('hidden', v === 'client');
  document.getElementById('reg-firm-parent').classList.toggle('hidden', v !== 'advisor');
}

function enterPortal(u) {
  session.userId = u.id;
  sessionStorage.setItem('nyaya_uid', u.id);
  ['win-welcome', 'win-auth'].forEach(id => document.getElementById(id).classList.add('hidden'));
  document.getElementById('btn-logout').classList.remove('hidden');
  const hb = document.getElementById('hdr-badge');
  hb.textContent = u.role === 'firm' ? 'Legal Firm' : u.role === 'advisor' ? 'Advisor' : 'Requestee';
  hb.classList.remove('hidden');
  if (u.role === 'client') {
    document.getElementById('win-advisor').classList.add('hidden');
    document.getElementById('win-client').classList.remove('hidden');
    document.getElementById('cli-avatar').textContent = initials(u.name);
    document.getElementById('cli-welcome').textContent = `Welcome, ${u.name} (Requestee)`;
    document.getElementById('case-pin').value = u.pin || '';
    populateStatesAndCities('case-state', 'case-city', u.state, u.city);
    updateLivePreview(); renderClientDash(); switchClientTab('new-case');
  } else {
    document.getElementById('win-client').classList.add('hidden');
    document.getElementById('win-advisor').classList.remove('hidden');
    document.getElementById('adv-avatar').textContent = initials(u.name);
    document.getElementById('adv-welcome').textContent = `Welcome, ${u.name} (${u.role === 'firm' ? 'Legal Organisation' : 'Independent Advisor'})`;
    renderAdvisorDash(); switchAdvisorTab('requests');
  }
}

function switchClientTab(tab) {
  ['new-case', 'my-cases', 'notifications', 'mail', 'profile'].forEach(t => document.getElementById('cview-' + t).classList.toggle('hidden', t !== tab));
  document.querySelectorAll('.ctab').forEach(b => {
    const a = b.getAttribute('data-ctab') === tab;
    b.className = a ? 'ctab px-3 py-1.5 rounded-xl text-xs font-bold bg-[#08519C] text-white' : 'ctab px-3 py-1.5 rounded-xl text-xs font-bold bg-[#DEEBF7] text-[#08306B]';
  });
  if (tab === 'my-cases') renderClientDash();
  if (tab === 'notifications') renderClientNotifs();
  if (tab === 'mail') renderMail('client');
  if (tab === 'profile') renderClientProfile();
}

function switchAdvisorTab(tab) {
  ['requests', 'notifications', 'profile', 'mail'].forEach(t => document.getElementById('aview-' + t).classList.toggle('hidden', t !== tab));
  document.querySelectorAll('.atab').forEach(b => {
    const a = b.getAttribute('data-atab') === tab;
    b.className = a ? 'atab px-3 py-1.5 rounded-xl text-xs font-bold bg-[#08519C] text-white' : 'atab px-3 py-1.5 rounded-xl text-xs font-bold bg-[#DEEBF7] text-[#08306B]';
  });
  if (tab === 'requests' || tab === 'notifications') renderAdvisorDash();
  if (tab === 'profile') populateAdvisorForm();
  if (tab === 'mail') renderMail('advisor');
}

function updateLivePreview() {
  const u = curUser(); if (!u) return;
  const st = (document.getElementById('case-state').value || u.state || 'MP').slice(0,2).toUpperCase();
  const ct = (document.getElementById('case-primary').value || 'CIV').slice(0,3).toUpperCase();
  const pin = document.getElementById('case-pin').value || u.pin || '482001';
  document.getElementById('live-case-preview').textContent = `Preview: ${st}/${ct}/${pin}/${String((db.cases||[]).length + 1).padStart(3,'0')}`;
}
