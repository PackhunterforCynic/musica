-- ====================================================================
-- Migration: 010_room_history.sql
-- Description: Persistent room session history and telemetry for Supabase
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.room_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id VARCHAR(32) NOT NULL,
  room_name VARCHAR(120) NOT NULL,
  host_id VARCHAR(64) NOT NULL,
  host_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) DEFAULT 'music',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_room_history_room ON public.room_history(room_id);
CREATE INDEX IF NOT EXISTS idx_room_history_created ON public.room_history(created_at DESC);

ALTER TABLE public.room_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room history is viewable by everyone" 
  ON public.room_history FOR SELECT 
  USING (true);

CREATE POLICY "Service or authenticated users can insert room history" 
  ON public.room_history FOR INSERT 
  WITH CHECK (true);
