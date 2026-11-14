-- ============================================================================
-- NyayaSetu Production PostgreSQL Schema (Supabase)
-- Supports both relational tables & JSON state sync (nyayasetu_store)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Key-value sync store (for instant multi-device client/admin state sync)
CREATE TABLE IF NOT EXISTS nyayasetu_store (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Users (Clients & Legal Advisors)
CREATE TABLE IF NOT EXISTS nyayasetu_users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('client', 'advisor')),
  name TEXT NOT NULL,
  age INTEGER,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  city TEXT,
  state TEXT,
  pin TEXT,
  licence_number TEXT,
  photo_data_url TEXT,
  password_hash TEXT NOT NULL,
  college TEXT,
  university TEXT,
  passing_year INTEGER,
  years_of_experience INTEGER DEFAULT 0,
  fee_min INTEGER DEFAULT 1000,
  fee_max INTEGER DEFAULT 5000,
  address TEXT,
  specialisations JSONB DEFAULT '[]'::jsonb,
  bio TEXT,
  -- Advisor Verification (controlled by independent Admin portal)
  advisor_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_note TEXT,
  verified_at TIMESTAMPTZ,
  -- Subscription & Contact Allowance State
  subscription_plan TEXT NOT NULL DEFAULT 'free_starter',
  subscription_scope TEXT NOT NULL DEFAULT 'free',
  contact_credits_remaining INTEGER NOT NULL DEFAULT 0,
  subscription_expires_at TIMESTAMPTZ,
  free_contacts_used INTEGER NOT NULL DEFAULT 0,
  unlocked_contact_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Dynamic Subscription Rules & Plans (editable by Admin)
CREATE TABLE IF NOT EXISTS nyayasetu_subscription_rules (
  role TEXT PRIMARY KEY CHECK (role IN ('client', 'advisor')),
  free_contacts INTEGER NOT NULL,
  push_after_contacts INTEGER NOT NULL,
  plans JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed exact Client & Advisor rules
INSERT INTO nyayasetu_subscription_rules (role, free_contacts, push_after_contacts, plans)
VALUES
  (
    'client',
    3,
    2,
    '[
      {"id":"cli_pay_per_contact","name":"Single Contact Unlock","priceInr":9,"credits":1,"durationDays":0,"scope":"per_contact","enabled":true,"description":"₹9 per advisor contact accessibility"},
      {"id":"cli_pack_5","name":"5 Contacts Pack","priceInr":29,"credits":5,"durationDays":0,"scope":"pack","enabled":true,"description":"₹29 for 5 advisor contacts"},
      {"id":"cli_pack_20","name":"20 Contacts Pack","priceInr":99,"credits":20,"durationDays":0,"scope":"pack","enabled":true,"description":"₹99 for 20 advisor contacts"},
      {"id":"cli_unlimited_28d","name":"28-Day Unlimited Access","priceInr":149,"credits":999999,"durationDays":28,"scope":"all_unlimited","enabled":true,"description":"₹149 for 28 days free accessibility to all advisor contacts"}
    ]'::jsonb
  ),
  (
    'advisor',
    1,
    1,
    '[
      {"id":"adv_pay_per_contact","name":"Single Contact Unlock","priceInr":5,"credits":1,"durationDays":0,"scope":"per_contact","enabled":true,"description":"₹5 to access each client contact"},
      {"id":"adv_monthly_5","name":"Monthly 5 Pool Contacts","priceInr":9,"credits":5,"durationDays":30,"scope":"pool","enabled":true,"description":"₹9/month to access 5 contacts from the complaint pool"},
      {"id":"adv_monthly_notified","name":"Monthly Unlimited Notified","priceInr":149,"credits":999999,"durationDays":30,"scope":"notified_unlimited","enabled":true,"description":"₹149/month unlimited contacts for notified or client-reached-out cases"},
      {"id":"adv_28d_100","name":"28-Day 100 Pool Contacts","priceInr":599,"credits":100,"durationDays":28,"scope":"pool","enabled":true,"description":"₹599 for 28 days subscription to 100 contact views from pool"}
    ]'::jsonb
  )
ON CONFLICT (role) DO NOTHING;

-- 4. Cases
CREATE TABLE IF NOT EXISTS nyayasetu_cases (
  id TEXT PRIMARY KEY,
  case_number TEXT UNIQUE NOT NULL,
  client_id TEXT NOT NULL REFERENCES nyayasetu_users(id) ON DELETE CASCADE,
  incident_type TEXT NOT NULL,
  incident_date TEXT,
  state TEXT,
  city TEXT,
  pin TEXT,
  police_station TEXT,
  subject TEXT,
  summary TEXT,
  unlocked_scope TEXT DEFAULT 'city',
  unlocked_advisors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Contact Unlocks Ledger
CREATE TABLE IF NOT EXISTS nyayasetu_contact_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id TEXT NOT NULL REFERENCES nyayasetu_users(id) ON DELETE CASCADE,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('client', 'advisor')),
  target_id TEXT NOT NULL,
  case_id TEXT,
  used_free_quota BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. UPI / GPay Payment Links & Transactions
CREATE TABLE IF NOT EXISTS nyayasetu_upi_payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES nyayasetu_users(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL CHECK (user_role IN ('client', 'advisor')),
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  amount_inr INTEGER NOT NULL,
  payment_mode TEXT NOT NULL DEFAULT 'UPI',
  merchant_vpa TEXT NOT NULL,
  upi_link TEXT NOT NULL,
  gpay_link TEXT NOT NULL,
  utr_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

-- 7. Case Mail & Notifications
CREATE TABLE IF NOT EXISTS nyayasetu_case_messages (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_users_role_verified ON nyayasetu_users(role, advisor_verified);
CREATE INDEX IF NOT EXISTS idx_upi_user_status ON nyayasetu_upi_payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_cases_pin ON nyayasetu_cases(pin);