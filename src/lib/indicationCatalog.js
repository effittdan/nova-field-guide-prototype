import { indicationGroups as fallbackIndicationGroups } from "./caseModel";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

function slugToGroupId(slug) {
  if (slug === "dry-eye-drivers") return "dryEyeDrivers";
  return slug;
}

function sortByDisplayOrder(left, right) {
  return (left.display_order ?? 0) - (right.display_order ?? 0);
}

export async function loadIndicationGroups() {
  if (!isSupabaseConfigured || !supabase) {
    return {
      groups: fallbackIndicationGroups,
      source: "fallback",
      message: "Using local demo indication list."
    };
  }

  const { data, error } = await supabase
    .from("indication_groups")
    .select("slug,label,display_order,indications(label,display_order,is_active)")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error || !Array.isArray(data) || data.length === 0) {
    return {
      groups: fallbackIndicationGroups,
      source: "fallback",
      message: "Supabase unavailable; using local demo indication list."
    };
  }

  const groups = data.map((group) => ({
    id: slugToGroupId(group.slug),
    label: group.label,
    options: (group.indications || [])
      .filter((item) => item.is_active !== false)
      .sort(sortByDisplayOrder)
      .map((item) => item.label)
  }));

  return {
    groups,
    source: "supabase",
    message: "Supabase connected; indication list loaded."
  };
}
