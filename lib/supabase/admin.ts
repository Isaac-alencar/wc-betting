import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/supabase/types.gen";

// Bypasses RLS — use only in admin Server Actions
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
    }
  );
}
