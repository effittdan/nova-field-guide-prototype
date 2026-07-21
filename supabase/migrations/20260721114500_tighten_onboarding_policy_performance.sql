create index if not exists onboarding_requests_reviewed_by_idx
on public.onboarding_requests(reviewed_by)
where reviewed_by is not null;

drop policy if exists "users can read own profile" on public.profiles;
drop policy if exists "amnioptix support can read all profiles" on public.profiles;
create policy "users and support can read profiles"
on public.profiles for select
to authenticated
using (
  id = (select auth.uid())
  or app_private.has_any_role(array['amnioptix_support']::public.member_role[])
);

drop policy if exists "members can read own memberships" on public.memberships;
drop policy if exists "amnioptix support can read memberships" on public.memberships;
create policy "users and support can read memberships"
on public.memberships for select
to authenticated
using (
  user_id = (select auth.uid())
  or app_private.has_any_role(array['amnioptix_support']::public.member_role[])
);

drop policy if exists "clinicians can read own onboarding requests" on public.onboarding_requests;
drop policy if exists "amnioptix support can read onboarding requests" on public.onboarding_requests;
create policy "clinicians and support can read onboarding requests"
on public.onboarding_requests for select
to authenticated
using (
  requested_by = (select auth.uid())
  or app_private.has_any_role(array['amnioptix_support']::public.member_role[])
);
