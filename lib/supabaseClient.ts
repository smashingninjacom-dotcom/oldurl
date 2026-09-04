import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hoyvpagqibfibhtixjum.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_uDy2yooBko1Pe80pZ61vMw_OJxliWNd';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '12118986043-76plu35da6utclphjkv263usqigb4hgt.apps.googleusercontent.com';

export async function signInWithGoogleIdToken(idToken: string) {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (error) {
    console.error('Supabase ID Token Error:', error.message);
    throw error;
  }
  return data;
}

export async function signInWithGoogle(redirectTo?: string) {
  const redirectUrl =
    redirectTo ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/dashboard`
      : 'https://oldurl.vercel.app/dashboard');

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        prompt: 'select_account',
        access_type: 'offline',
      },
    },
  });

  if (error) {
    console.error('Google OAuth Error:', error.message);
    throw error;
  }
}

