import { supabase } from '@/lib/supabase';

import { ApiError } from './errors';

export function requireSupabase() {
  if (!supabase) {
    throw new ApiError(
      'Supabase no está configurado. Agrega EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }
  return supabase;
}
