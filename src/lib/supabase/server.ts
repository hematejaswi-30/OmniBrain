// src/lib/supabase/server.ts
import { createClient } from '@supabase/supabase-js';

// In a real application with SSR authentication, you would use @supabase/ssr
// and pass in the cookie store from next/headers.
// For the sake of this specification, this function exposes the configured client.
export const createServerClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
};
