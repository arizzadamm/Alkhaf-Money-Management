alter table public.app_users
add column if not exists role text default 'user';

update public.app_users
set role = 'user'
where role is null or trim(role) = '';

insert into public.app_users (username, password, role)
select 'admin', 'sha256:240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin'
where not exists (
  select 1
  from public.app_users
  where username = 'admin'
);
