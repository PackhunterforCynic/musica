-- ====================================================================
-- Seed: seed.sql
-- Description: Development seed data for Musica 1.0 environments
-- ====================================================================

-- 1. Demo Rooms
INSERT INTO public.rooms (code, name, description, type, status, host_name, max_participants, is_private, config)
VALUES 
  ('DEMO', 'Musica 1.0 Showcase', 'Public community media studio and watch party', 'studio', 'live', 'AlexDJ', 50, false, '{"allowAudio":true,"allowVideo":true,"allowScreenShare":true,"allowChat":true,"allowRecording":false,"requireApproval":false}'::jsonb),
  ('POD1', 'The Real-Time Web Podcast', 'Weekly discussions on WebRTC, SFUs, and LiveKit', 'podcast', 'live', 'SarahHost', 50, false, '{"allowAudio":true,"allowVideo":true,"allowScreenShare":true,"allowChat":true,"allowRecording":true,"requireApproval":true}'::jsonb),
  ('CS10', 'CS 101: Distributed Systems', 'Live classroom lecture on consensus algorithms and NTP time sync', 'classroom', 'live', 'ProfAlan', 60, false, '{"allowAudio":true,"allowVideo":true,"allowScreenShare":true,"allowChat":true,"allowRecording":true,"requireApproval":false}'::jsonb),
  ('TECH', 'Quick Assistance Session', 'Browser-based AnyViewer guidance and laser annotations', 'remote_support', 'waiting', 'CustomerDave', 2, true, '{"allowAudio":true,"allowVideo":false,"allowScreenShare":true,"allowChat":true,"allowRecording":false,"requireApproval":false}'::jsonb)
ON CONFLICT (code) DO NOTHING;
