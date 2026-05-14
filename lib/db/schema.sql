-- Mailpilot — Supabase schema
--
-- Run in Supabase SQL Editor (or `supabase db push`) after creating the project.
-- These tables back the email account store. RLS is enabled but bypassed by
-- the server-side SERVICE_ROLE key. Browsers never talk directly to these
-- tables — all reads/writes go through API routes.

create table if not exists sessions (
  id text primary key,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists accounts (
  id text primary key,
  session_id text not null references sessions(id) on delete cascade,
  provider text not null check (provider in ('gmail', 'graph', 'imap')),
  email text not null,
  display_name text,

  -- IMAP fields (NULL for OAuth providers)
  imap_host text,
  imap_port int,
  imap_user text,
  imap_password_encrypted text,   -- AES-256-GCM, base64
  smtp_host text,
  smtp_port int,

  -- OAuth fields (NULL for IMAP)
  oauth_refresh_token_encrypted text,

  -- AI consent (per-account, default OFF — CLAUDE.md R3)
  ai_consent boolean not null default false,

  added_at timestamptz not null default now()
);

create index if not exists accounts_session_id_idx on accounts(session_id);
create index if not exists accounts_email_idx on accounts(email);

alter table sessions enable row level security;
alter table accounts enable row level security;

-- No public policies: the service role bypasses RLS. Anon keys see nothing.
-- If you later add Supabase Auth user-binding, add policies like:
--   create policy "users see own accounts" on accounts
--     for select using (auth.uid()::text = session_id);
