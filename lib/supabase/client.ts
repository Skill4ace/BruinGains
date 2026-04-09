import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabasePublicEnv = Boolean(supabaseUrl && supabasePublishableKey);

export const supabasePublicClient = hasSupabasePublicEnv
  ? createClient<Database>(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    })
  : null;
