-- ====================================================================
-- Migration: 007_recordings.sql
-- Description: LiveKit Egress recordings metadata and storage URLs
-- ====================================================================

DO $$ BEGIN
  CREATE TYPE public.recording_status AS ENUM ('starting', 'recording', 'processing', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  egress_id VARCHAR(64) UNIQUE, -- LiveKit Egress ID
  status public.recording_status NOT NULL DEFAULT 'starting',
  file_url TEXT,
  file_size_bytes BIGINT,
  duration_seconds INT,
  started_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  consent_given BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recordings_room ON public.recordings(room_id);
CREATE INDEX IF NOT EXISTS idx_recordings_egress ON public.recordings(egress_id);

-- Enable RLS
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room owners can access recordings" 
  ON public.recordings FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND owner_id = auth.uid())
  );
