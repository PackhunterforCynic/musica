-- ====================================================================
-- Migration: 009_support_sessions.sql
-- Description: Remote assistance sessions, consent audit, laser pointer logs
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.support_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  session_code VARCHAR(8) NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name VARCHAR(100) NOT NULL,
  technician_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  technician_name VARCHAR(100),
  consent_granted BOOLEAN NOT NULL DEFAULT true,
  screen_sharing_active BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMPTZ
);

-- Remote Support Audit & Annotation Logs
CREATE TABLE IF NOT EXISTS public.support_annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  support_session_id UUID NOT NULL REFERENCES public.support_sessions(id) ON DELETE CASCADE,
  x_ratio FLOAT NOT NULL,
  y_ratio FLOAT NOT NULL,
  label VARCHAR(100),
  technician_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_sessions_code ON public.support_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_support_annotations_session ON public.support_annotations(support_session_id);

-- Enable RLS
ALTER TABLE public.support_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view support session" 
  ON public.support_sessions FOR SELECT 
  USING (auth.uid() = customer_id OR auth.uid() = technician_id OR auth.uid() IS NULL);

CREATE POLICY "Participants can view annotations" 
  ON public.support_annotations FOR SELECT 
  USING (true);

CREATE POLICY "Technician can create annotations" 
  ON public.support_annotations FOR INSERT 
  WITH CHECK (true);
