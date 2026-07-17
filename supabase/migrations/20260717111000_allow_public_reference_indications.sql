grant usage on schema public to anon, authenticated;
grant select on public.indication_groups to anon, authenticated;
grant select on public.indications to anon, authenticated;

drop policy if exists "authenticated can read active indication groups" on public.indication_groups;
drop policy if exists "authenticated can read active indications" on public.indications;

create policy "public can read active indication groups"
on public.indication_groups for select
to anon, authenticated
using (is_active = true);

create policy "public can read active indications"
on public.indications for select
to anon, authenticated
using (is_active = true);
