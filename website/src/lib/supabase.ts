import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder";

// Server-side client with service_role key (full access, bypasses RLS)
// During build, env vars may be missing — placeholder values are used
// but API routes will fail at runtime if not properly configured.
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
