-- ====================================================================
-- Migration: 002_rooms.sql
-- Description: Core rooms table with room type configurations & RLS
-- ====================================================================

-- Room type and status enums
DO $$ BEGIN
  CREATE TYPE public.room_type AS ENUM ('private', 'podcast', 'classroom', 'remote_support', 'studio', 'couple');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.room_status AS ENUM ('waiting', 'live', 'ended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(8) UNIQUE NOT NULL, -- e.g. 4-character or 6-character room PIN
  name VARCHAR(120) NOT NULL,
  description TEXT,
  type public.room_type NOT NULL DEFAULT 'studio',
  status public.room_status NOT NULL DEFAULT 'waiting',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  host_name VARCHAR(100) NOT NULL,
  max_participants INT NOT NULL DEFAULT 50,
  is_private BOOLEAN NOT NULL DEFAULT false,
  password_hash TEXT, -- Optional scrypt/Argon2 hash
  
  -- Room Engine Capabilities (JSONB)
  config JSONB NOT NULL DEFAULT '{
    "allowAudio": true,
    "allowVideo": true,
    "allowScreenShare": true,
    "allowChat": true,
    "allowRecording": false,
    "requireApproval": false
  }'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMPTZ
);

-- Constraints
ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS check_private_capacity;
ALTER TABLE public.rooms ADD CONSTRAINT check_private_capacity 
  CHECK (type NOT IN ('private', 'remote_support') OR max_participants = 2);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rooms_code ON public.rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_owner ON public.rooms(owner_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON public.rooms(type);

-- Enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- 1. Public or live rooms are viewable by authenticated users
CREATE POLICY "Public rooms are discoverable" 
  ON public.rooms FOR SELECT 
  USING (is_private = false OR auth.uid() = owner_id);

-- 2. Authenticated users can create rooms
CREATE POLICY "Authenticated users can create rooms" 
  ON public.rooms FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- 3. Room owners can update their rooms
CREATE POLICY "Room owners can update room settings" 
  ON public.rooms FOR UPDATE 
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
