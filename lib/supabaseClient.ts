import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hoyvpagqibfibhtixjum.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_uDy2yooBko1Pe80pZ61vMw_OJxliWNd';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
