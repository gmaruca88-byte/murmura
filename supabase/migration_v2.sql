-- ===========================================================
--  MURMURA — Migrazione v2 (eseguila in Supabase: SQL Editor)
--  Aggiunge: risposte ai messaggi, un solo voto per utente,
--  gestione sponsor con immagini, bucket storage per le foto.
-- ===========================================================

-- 1) Risposte: un messaggio può rispondere a un altro
alter table messages add column if not exists parent_id bigint references messages(id) on delete cascade;
create index if not exists idx_msg_parent on messages(parent_id);

-- 2) Un solo voto (fiamma) per utente/dispositivo su ogni messaggio
create table if not exists message_likes (
  message_id bigint references messages(id) on delete cascade,
  ip_hash    text,
  created_at timestamptz default now(),
  primary key (message_id, ip_hash)
);
alter table message_likes enable row level security;

-- 3) Sponsor / spazi pubblicitari per ogni muro
create table if not exists sponsors (
  id         bigint generated always as identity primary key,
  wall_code  text not null references walls(code) on delete cascade,
  slot       text not null,          -- 'left' | 'right' | 'feed'
  title      text,
  subtitle   text,
  link       text,
  image_url  text,
  active     boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_sponsor_wall on sponsors(wall_code);
alter table sponsors enable row level security;

-- 4) Bucket pubblico per le immagini degli sponsor
insert into storage.buckets (id, name, public)
values ('sponsors', 'sponsors', true)
on conflict (id) do nothing;
