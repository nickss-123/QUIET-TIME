import { createClient } from '@supabase/supabase-js'

// Service-role client. Server-only — never import this from a Client
// Component or expose SUPABASE_SERVICE_ROLE_KEY to the browser.
// Used for admin.createUser / admin.updateUserById, which the anon
// key cannot do regardless of RLS.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
