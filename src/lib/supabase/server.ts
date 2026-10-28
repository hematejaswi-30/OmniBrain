// src/lib/supabase/server.ts
import { createServerClient as createSsrServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Creates an SSR-compatible Supabase client tied to the active user's session cookies.
 * Enables live authentication resolution (supabase.auth.getUser()) in Next.js Server Components and Route Handlers.
 */
export const createServerClient = async () => {
  const cookieStore = await cookies();

  return createSsrServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored when called from server routes or read-only operations
          }
        },
      },
    }
  );
};

/**
 * Creates a privileged service-role admin client that bypasses PostgreSQL RLS policies.
 * Used for server-side maintenance, seed data fallbacks, or background batch jobs.
 */
export const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
};

/**
 * Safely resolves the active user from session cookies.
 * Never throws AuthSessionMissingError or destructuring null errors.
 */
export const getAuthUser = async (client?: any) => {
  try {
    const supabase = client || (await createServerClient());
    const { data, error } = await supabase.auth.getUser();
    if (error || !data) return null;
    return data.user || null;
  } catch {
    return null;
  }
};
