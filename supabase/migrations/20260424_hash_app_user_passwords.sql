create extension if not exists pgcrypto;

update public.app_users
set password = 'sha256:' || encode(digest(password, 'sha256'), 'hex')
where password is not null
  and password not like 'sha256:%';
