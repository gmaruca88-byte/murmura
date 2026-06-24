import { createClient } from "@supabase/supabase-js";

// Client server-side con service_role: bypassa RLS. NON usare mai nel browser.
// I fallback evitano che la build fallisca quando le env non sono ancora impostate;
// le richieste reali falliranno comunque finché non configuri le variabili.
export const db = createClient(
  process.env.SUPABASE_URL || "http://localhost:54321",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "missing-key",
  { auth: { persistSession: false } }
);
