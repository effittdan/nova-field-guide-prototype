import { facilities as demoFacilities } from "./caseModel";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

export const demoPracticeContext = {
  source: "demo",
  message: "Using local demo practice setup.",
  organizationId: "demo-org-northstar",
  practiceName: "Northstar Mobile Eye Group",
  role: "demo",
  facilities: demoFacilities.map((name) => ({ id: name, name }))
};

export async function loadPracticeContext(session) {
  if (!isSupabaseConfigured || !session?.user) return demoPracticeContext;

  const { data: memberships, error: membershipError } = await supabase
    .from("memberships")
    .select("role, organization_id, organizations(id,name,partner_brand_name)")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (membershipError) throw membershipError;

  const membership = memberships?.[0];
  const organization = membership?.organizations;

  if (!membership || !organization) {
    return {
      source: "unassigned",
      message: "Signed in. Practice setup is waiting for AmniOptix admin assignment.",
      organizationId: "",
      practiceName: "Practice setup pending",
      role: "",
      facilities: []
    };
  }

  const { data: facilities, error: facilityError } = await supabase
    .from("facilities")
    .select("id,name,city,state")
    .eq("organization_id", organization.id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (facilityError) throw facilityError;

  return {
    source: "supabase",
    message: "Practice setup loaded from Supabase.",
    organizationId: organization.id,
    practiceName: organization.partner_brand_name || organization.name,
    role: membership.role,
    facilities: facilities || []
  };
}
