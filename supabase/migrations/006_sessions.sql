-- ====================================================================
-- Migration: 006_sessions.sql
-- Description: Historical session metadata, duration, and telemetry
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  room_code VARCHAR(8) NOT NULL,
  room_type public.room_type NOT NULL,
  host_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  host_name VARCHAR(100) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  duration_seconds INT NOT NULL,
  peak_participants INT DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_room_code ON public.sessions(room_code);
CREATE INDEX IF NOT EXISTS idx_sessions_host ON public.sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON public.sessions(started_at DESC);

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sessions they hosted or attended" 
  ON public.sessions FOR SELECT 
  USING (auth.uid() = host_id OR auth.uid() IS NULL);

CREATE POLICY "Service role can insert session history" 
  ON public.sessions FOR INSERT 
  WITH CHECK (true);
