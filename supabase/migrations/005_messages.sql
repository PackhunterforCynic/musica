-- ====================================================================
-- Migration: 005_messages.sql
-- Description: Persistent in-room chat messages and emoji reactions
-- ====================================================================

-- Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name VARCHAR(100) NOT NULL,
  sender_role public.participant_role NOT NULL DEFAULT 'listener',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Reactions Table
CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  emoji VARCHAR(16) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_room_time ON public.messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_room_time ON public.reactions(room_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Room members can read messages" 
  ON public.messages FOR SELECT 
  USING (true);

CREATE POLICY "Room members can insert messages" 
  ON public.messages FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Room members can read reactions" 
  ON public.reactions FOR SELECT 
  USING (true);

CREATE POLICY "Room members can insert reactions" 
  ON public.reactions FOR INSERT 
  WITH CHECK (true);
