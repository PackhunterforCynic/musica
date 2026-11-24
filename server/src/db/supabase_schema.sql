-- ==============================================================================
-- MUSICA 2.0 — SUPABASE POSTGRESQL SCHEMA & ROW LEVEL SECURITY
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ymzpafxyrmiaizxacmrx/sql
-- ==============================================================================

-- 1. Profiles Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Room History Table
CREATE TABLE IF NOT EXISTS public.room_history (
  id BIGSERIAL PRIMARY KEY,
  room_id VARCHAR(10) NOT NULL,
  room_name TEXT NOT NULL,
  host_id TEXT NOT NULL,
  host_name TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'music',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

ALTER TABLE public.room_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room history is viewable by all authenticated users."
  ON public.room_history FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert room history."
  ON public.room_history FOR INSERT
  WITH CHECK (true);

-- 3. Automatic Profile Creation Trigger on Sign-Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || SUBSTRING(NEW.id::text, 1, 6)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Musica Explorer'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
