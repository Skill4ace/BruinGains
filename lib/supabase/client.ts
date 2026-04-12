import AsyncStorage from '@react-native-async-storage/async-storage';
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
        autoRefreshToken: true,
        detectSessionInUrl: false,
        persistSession: true,
        storage: AsyncStorage,
      },
    })
  : null;

let ensureSessionPromise: Promise<void> | null = null;

function sessionExpiresSoon(expiresAt?: number | null) {
  if (!expiresAt) {
    return true;
  }

  return expiresAt * 1000 <= Date.now() + 60_000;
}

export async function ensureAnonymousSupabaseSession() {
  if (!supabasePublicClient) {
    return;
  }

  if (ensureSessionPromise) {
    return ensureSessionPromise;
  }

  ensureSessionPromise = (async () => {
    const {
      data: { session },
      error: sessionError,
    } = await supabasePublicClient.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (session?.access_token && !sessionExpiresSoon(session.expires_at)) {
      return;
    }

    if (session?.refresh_token) {
      const { error: refreshError } = await supabasePublicClient.auth.refreshSession();

      if (!refreshError) {
        return;
      }
    }

    const { error: signInError } = await supabasePublicClient.auth.signInAnonymously();

    if (signInError) {
      throw signInError;
    }
  })().finally(() => {
    ensureSessionPromise = null;
  });

  return ensureSessionPromise;
}
