-- NyayaSetu Production Supabase Postgres Schema (₹0 Free Tier)
create table if not exists nyayasetu_store (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz default now()
);

create table if not exists nyayasetu_users (
  id text primary key,
  role text not null,
  name text not null,
  email text,
  phone text,
  city text,
  state text,
  pin text,
  licence_number text,
  created_at timestamptz default now()
);

-- Optional read-only SQL RPC for Admin Console
create or replace function run_readonly_sql(query_text text)
returns jsonb language plpgsql security definer as $$
declare result jsonb;
begin
  if lower(trim(query_text)) not like 'select %' then
    raise exception 'Only SELECT queries allowed';
  end if;
  execute 'select jsonb_agg(t) from (' || query_text || ') t' into result;
  return coalesce(result, '[]'::jsonb);
end;
$$;
