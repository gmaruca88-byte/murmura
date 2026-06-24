-- ===========================================================
--  MURMURA — schema database (eseguilo in Supabase: SQL Editor)
-- ===========================================================

create table if not exists walls (
  code        text primary key,
  name        text not null,
  kind        text,
  owner_key   text not null,
  created_at  timestamptz default now()
);

create table if not exists messages (
  id          bigint generated always as identity primary key,
  wall_code   text not null references walls(code) on delete cascade,
  text        text not null,
  alias       text,
  color       text,
  status      text default 'live',     -- 'live' | 'blocked'
  needs_review boolean default false,  -- true se l'AI non ha potuto verificare
  category    text,
  sentiment   text,                    -- 'pos' | 'neu' | 'neg'
  reason      text,
  likes       int default 0,
  ip_hash     text,                    -- IP anonimizzato (per gestione abusi/obblighi di legge)
  created_at  timestamptz default now()
);
create index if not exists idx_msg_wall on messages(wall_code, created_at);

create table if not exists analysis (
  wall_code    text primary key references walls(code) on delete cascade,
  data         jsonb,
  generated_at timestamptz default now()
);

-- incremento atomico dei like
create or replace function increment_like(msg_id bigint)
returns void language sql as $$
  update messages set likes = likes + 1 where id = msg_id;
$$;

-- ---- Row Level Security ----
-- Nessuna policy = nessun accesso anonimo diretto alle tabelle.
-- Tutto passa dalle API del server, che usano la chiave service_role (bypassa RLS).
alter table walls    enable row level security;
alter table messages enable row level security;
alter table analysis enable row level security;
