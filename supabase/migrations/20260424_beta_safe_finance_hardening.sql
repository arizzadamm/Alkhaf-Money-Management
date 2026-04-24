drop policy if exists "Allow anonymous all access on expenses" on public.expenses;
drop policy if exists "Allow anonymous all access on settings" on public.app_settings;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
