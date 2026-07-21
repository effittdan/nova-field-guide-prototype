import { isSupabaseConfigured, supabase } from "./supabaseClient";

export async function getCurrentSession() {
  if (!isSupabaseConfigured) return null;
  const {
    data: { session },
    error
  } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export function subscribeToAuthChanges(callback) {
  if (!isSupabaseConfigured) return () => {};
  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => subscription.unsubscribe();
}

export async function sendMagicLink(email) {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin
    }
  });
  if (error) throw error;
}

export async function signInWithPassword(email, password) {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
}

export async function signOut() {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function submitOnboardingRequest(request, userId) {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
  const facilityNames = request.facilityNames
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

  const { error } = await supabase.from("onboarding_requests").insert({
    clinician_name: request.clinicianName.trim(),
    email: request.email.trim(),
    phone: request.phone.trim() || null,
    practice_name: request.practiceName.trim() || null,
    ehr_system: request.ehrSystem.trim() || null,
    ehr_identifier_label: request.ehrIdentifierLabel.trim() || null,
    facility_names: facilityNames,
    notes: request.notes.trim() || null,
    requested_by: userId || null
  });

  if (error) throw error;
}
