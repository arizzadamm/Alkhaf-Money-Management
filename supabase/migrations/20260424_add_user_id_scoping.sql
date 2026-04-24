do $$
declare
  legacy_owner uuid;
begin
  select id into legacy_owner
  from public.app_users
  where username <> 'admin'
  order by created_at asc
  limit 1;

  if legacy_owner is null then
    select id into legacy_owner
    from public.app_users
    order by created_at asc
    limit 1;
  end if;

  if legacy_owner is null then
    raise exception 'No app_users row found to own existing records';
  end if;
end $$;

alter table public.expenses drop constraint if exists expenses_user_id_fkey;
alter table public.app_settings drop constraint if exists app_settings_user_id_fkey;

do $$
declare
  legacy_owner uuid;
begin
  select id into legacy_owner
  from public.app_users
  where username <> 'admin'
  order by created_at asc
  limit 1;

  if legacy_owner is null then
    select id into legacy_owner
    from public.app_users
    order by created_at asc
    limit 1;
  end if;

  alter table public.expenses add column if not exists user_id_uuid uuid;
  update public.expenses set user_id_uuid = legacy_owner where user_id_uuid is null;

  alter table public.app_settings add column if not exists user_id_uuid uuid;
  update public.app_settings set user_id_uuid = legacy_owner where user_id_uuid is null;
end $$;

alter table public.expenses drop column if exists user_id;
alter table public.app_settings drop column if exists user_id;

alter table public.expenses rename column user_id_uuid to user_id;
alter table public.app_settings rename column user_id_uuid to user_id;

alter table public.expenses alter column user_id set not null;
alter table public.app_settings alter column user_id set not null;

alter table public.expenses
add constraint expenses_user_id_fkey
foreign key (user_id) references public.app_users(id) on delete cascade;

alter table public.app_settings
add constraint app_settings_user_id_fkey
foreign key (user_id) references public.app_users(id) on delete cascade;

create unique index if not exists app_settings_user_id_key
on public.app_settings(user_id);

create index if not exists expenses_user_id_idx
on public.expenses(user_id);

create index if not exists expenses_user_id_budget_month_idx
on public.expenses(user_id, budget_month);

update public.app_users
set role = lower(role)
where role is not null
  and lower(role) in ('admin', 'user');
