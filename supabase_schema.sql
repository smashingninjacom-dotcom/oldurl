-- 1. Create Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  plan TEXT DEFAULT 'Free',
  quota_limit INTEGER DEFAULT 500,
  quota_used INTEGER DEFAULT 0,
  api_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- 2. Create Search History Table
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  domain TEXT NOT NULL,
  status TEXT NOT NULL,
  days_left TEXT,
  dr NUMERIC,
  registrar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own search history" 
  ON public.search_history FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search history" 
  ON public.search_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 3. Create Watchlist Table
CREATE TABLE IF NOT EXISTS public.watchlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  domain TEXT NOT NULL,
  target_dr NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlists" 
  ON public.watchlists FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlists" 
  ON public.watchlists FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 4. Trigger to automatically create a profile entry when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, api_key)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'oldurl_live_' || md5(random()::text || clock_timestamp()::text)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
