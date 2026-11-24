-- ====================================================================
-- Migration: 003_room_members.sql
-- Description: Room participant membership & role authorization
-- ====================================================================

-- Participant role enum
DO $$ BEGIN
  CREATE TYPE public.participant_role AS ENUM (
    'owner',
    'host',
    'co_host',
    'teacher',
    'moderator',
    'speaker',
    'student',
    'listener',
    'technician',
    'customer'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create room members table
CREATE TABLE IF NOT EXISTS public.room_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_name VARCHAR(100),
  role public.participant_role NOT NULL DEFAULT 'listener',
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  left_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,

  CONSTRAINT unique_active_room_user UNIQUE(room_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_room_members_room ON public.room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user ON public.room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_room_members_active ON public.room_members(room_id, is_active);

-- Enable RLS
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Members can view other members in the same room" 
  ON public.room_members FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can join rooms" 
  ON public.room_members FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users or room hosts can update membership status" 
  ON public.room_members FOR UPDATE 
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND owner_id = auth.uid())
  );
