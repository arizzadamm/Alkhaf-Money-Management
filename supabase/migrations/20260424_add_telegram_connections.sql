create extension if not exists pgcrypto;

create table if not exists public.telegram_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  telegram_user_id bigint,
  telegram_chat_id bigint not null,
  chat_type text not null default 'private',
  label text,
  is_verified boolean not null default false,
  is_primary boolean not null default false,
  linked_at timestamp with time zone,
  last_seen_at timestamp with time zone,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint telegram_connections_chat_type_check
    check (chat_type in ('private', 'group', 'supergroup', 'channel'))
);

create unique index if not exists telegram_connections_user_chat_key
on public.telegram_connections(user_id, telegram_chat_id);

create unique index if not exists telegram_connections_chat_id_key
on public.telegram_connections(telegram_chat_id);

create unique index if not exists telegram_connections_primary_per_user_key
on public.telegram_connections(user_id)
where is_primary = true;

create index if not exists telegram_connections_user_id_idx
on public.telegram_connections(user_id);

create index if not exists telegram_connections_verified_idx
on public.telegram_connections(user_id, is_verified);

create table if not exists public.telegram_link_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  token text not null,
  purpose text not null default 'telegram_link',
  expires_at timestamp with time zone not null,
  consumed_at timestamp with time zone,
  telegram_user_id bigint,
  telegram_chat_id bigint,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint telegram_link_tokens_purpose_check
    check (purpose in ('telegram_link', 'telegram_relink'))
);

create unique index if not exists telegram_link_tokens_token_key
on public.telegram_link_tokens(token);

create index if not exists telegram_link_tokens_user_id_idx
on public.telegram_link_tokens(user_id);

create index if not exists telegram_link_tokens_active_idx
on public.telegram_link_tokens(user_id, expires_at)
where consumed_at is null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists telegram_connections_set_updated_at on public.telegram_connections;

create trigger telegram_connections_set_updated_at
before update on public.telegram_connections
for each row
execute function public.set_updated_at();

alter table public.telegram_connections enable row level security;
alter table public.telegram_link_tokens enable row level security;

drop policy if exists "Allow anonymous read access on telegram_connections" on public.telegram_connections;
drop policy if exists "Allow anonymous read access on telegram_link_tokens" on public.telegram_link_tokens;
