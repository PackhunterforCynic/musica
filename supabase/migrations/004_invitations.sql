-- ====================================================================
-- Migration: 004_invitations.sql
-- Description: Room invitations, secure invitation tokens & access rules
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  token VARCHAR(64) UNIQUE NOT NULL,
  role public.participant_role NOT NULL DEFAULT 'listener',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INT DEFAULT 1,
  used_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_room ON public.invitations(room_id);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Room owners can manage invitations" 
  ON public.invitations FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND owner_id = auth.uid())
  );

CREATE POLICY "Anyone with token can inspect invitation validity" 
  ON public.invitations FOR SELECT 
  USING (expires_at > NOW() AND (max_uses IS NULL OR used_count < max_uses));
