drop policy if exists "members can read own organizations" on public.organizations;
create policy "members and support can read organizations"
on public.organizations for select
to authenticated
using (
  app_private.has_any_role(array['amnioptix_support']::public.member_role[])
  or app_private.has_org_role(id, array[
    'practitioner',
    'practice_admin',
    'supervisor',
    'amnioptix_support'
  ]::public.member_role[])
);

drop policy if exists "members can read own facilities" on public.facilities;
create policy "members and support can read facilities"
on public.facilities for select
to authenticated
using (
  app_private.has_any_role(array['amnioptix_support']::public.member_role[])
  or app_private.has_org_role(organization_id, array[
    'practitioner',
    'practice_admin',
    'supervisor',
    'amnioptix_support'
  ]::public.member_role[])
);
