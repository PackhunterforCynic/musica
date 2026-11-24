-- ====================================================================
-- MUSICA PLATFORM — COMPLETE PRODUCTION DATABASE SCHEMA
-- Supabase PostgreSQL + Row Level Security (RLS) + Triggers
-- Generated for Project: ymzpafxyrmiaizxacmrx
-- ====================================================================

-- --------------------------------------------------------------------
-- 0. EXTENSIONS
-- --------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. ENUMS
-- --------------------------------------------------------------------
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

DO $$ BEGIN
  CREATE TYPE public.recording_status AS ENUM ('starting', 'recording', 'processing', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- --------------------------------------------------------------------
-- 2. USER PROFILES (001_profiles.sql)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
  CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
EXCEPTION WHEN undefined_object THEN null; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
  CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN undefined_object THEN null; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
  CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
EXCEPTION WHEN undefined_object THEN null; END $$;

-- Auto-sync Trigger: Create profile row on auth.users registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Musica Member'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------------------------
-- 3. ROOMS (002_rooms.sql)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(8) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  type public.room_type NOT NULL DEFAULT 'studio',
  status public.room_status NOT NULL DEFAULT 'waiting',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  host_name VARCHAR(100) NOT NULL,
  max_participants INT NOT NULL DEFAULT 50,
  is_private BOOLEAN NOT NULL DEFAULT false,
  password_hash TEXT,
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

ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS check_private_capacity;
ALTER TABLE public.rooms ADD CONSTRAINT check_private_capacity 
  CHECK (type NOT IN ('private', 'remote_support') OR max_participants = 2);

CREATE INDEX IF NOT EXISTS idx_rooms_code ON public.rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_owner ON public.rooms(owner_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON public.rooms(type);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Public rooms are discoverable" ON public.rooms;
  CREATE POLICY "Public rooms are discoverable" ON public.rooms FOR SELECT USING (is_private = false OR auth.uid() = owner_id);
EXCEPTION WHEN undefined_object THEN null; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.rooms;
  CREATE POLICY "Authenticated users can create rooms" ON public.rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
EXCEPTION WHEN undefined_object THEN null; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Room owners can update room settings" ON public.rooms;
  CREATE POLICY "Room owners can update room settings" ON public.rooms FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
EXCEPTION WHEN undefined_object THEN null; END $$;

-- --------------------------------------------------------------------
-- 4. ROOM MEMBERS (003_room_members.sql)
-- --------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_room_members_room ON public.room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user ON public.room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_room_members_active ON public.room_members(room_id, is_active);

ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Members can view other members in the same room" ON public.room_members;
  CREATE POLICY "Members can view other members in the same room" ON public.room_members FOR SELECT USING (true);
EXCEPTION WHEN undefined_object THEN null; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated users can join rooms" ON public.room_members;
  CREATE POLICY "Authenticated users can join rooms" ON public.room_members FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
EXCEPTION WHEN undefined_object THEN null; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users or room hosts can update membership status" ON public.room_members;
  CREATE POLICY "Users or room hosts can update membership status" ON public.room_members FOR UPDATE 
    USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND owner_id = auth.uid()));
EXCEPTION WHEN undefined_object THEN null; END $$;

-- --------------------------------------------------------------------
-- 5. INVITATIONS (004_invitations.sql)
-- --------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_room ON public.invitations(room_id);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Room owners can manage invitations" ON public.invitations;
  CREATE POLICY "Room owners can manage invitations" ON public.invitations FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND owner_id = auth.uid()));
EXCEPTION WHEN undefined_object THEN null; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Anyone with token can inspect invitation validity" ON public.invitations;
  CREATE POLICY "Anyone with token can inspect invitation validity" ON public.invitations FOR SELECT 
    USING (expires_at > NOW() AND (max_uses IS NULL OR used_count < max_uses));
EXCEPTION WHEN undefined_object THEN null; END $$;

-- --------------------------------------------------------------------
-- 6. CHAT MESSAGES & REACTIONS (005_messages.sql)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name VARCHAR(100) NOT NULL,
  sender_role public.participant_role NOT NULL DEFAULT 'listener',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  emoji VARCHAR(16) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_room_time ON public.messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_room_time ON public.reactions(room_id, created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Room members can read messages" ON public.messages;
  CREATE POLICY "Room members can read messages" ON public.messages FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Room members can insert messages" ON public.messages;
  CREATE POLICY "Room members can insert messages" ON public.messages FOR INSERT WITH CHECK (true);
  DROP POLICY IF EXISTS "Room members can read reactions" ON public.reactions;
  CREATE POLICY "Room members can read reactions" ON public.reactions FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Room members can insert reactions" ON public.reactions;
  CREATE POLICY "Room members can insert reactions" ON public.reactions FOR INSERT WITH CHECK (true);
EXCEPTION WHEN undefined_object THEN null; END $$;

-- --------------------------------------------------------------------
-- 7. SESSIONS (006_sessions.sql)
-- --------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_sessions_room_code ON public.sessions(room_code);
CREATE INDEX IF NOT EXISTS idx_sessions_host ON public.sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON public.sessions(started_at DESC);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view sessions they hosted or attended" ON public.sessions;
  CREATE POLICY "Users can view sessions they hosted or attended" ON public.sessions FOR SELECT 
    USING (auth.uid() = host_id OR auth.uid() IS NULL);
  DROP POLICY IF EXISTS "Service role can insert session history" ON public.sessions;
  CREATE POLICY "Service role can insert session history" ON public.sessions FOR INSERT WITH CHECK (true);
EXCEPTION WHEN undefined_object THEN null; END $$;

-- --------------------------------------------------------------------
-- 8. RECORDINGS (007_recordings.sql)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  egress_id VARCHAR(64) UNIQUE,
  status public.recording_status NOT NULL DEFAULT 'starting',
  file_url TEXT,
  file_size_bytes BIGINT,
  duration_seconds INT,
  started_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  consent_given BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_recordings_room ON public.recordings(room_id);
CREATE INDEX IF NOT EXISTS idx_recordings_egress ON public.recordings(egress_id);

ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Room owners can access recordings" ON public.recordings;
  CREATE POLICY "Room owners can access recordings" ON public.recordings FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND owner_id = auth.uid()));
EXCEPTION WHEN undefined_object THEN null; END $$;

-- --------------------------------------------------------------------
-- 9. CLASSROOMS (008_classrooms.sql)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.classrooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_code VARCHAR(32),
  title VARCHAR(120) NOT NULL,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  lecture_notes TEXT,
  whiteboard_state JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.classroom_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  student_name VARCHAR(100) NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL,
  left_at TIMESTAMPTZ,
  duration_seconds INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.classroom_polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.classroom_poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES public.classroom_polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  option_index INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_poll_user UNIQUE(poll_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_classrooms_teacher ON public.classrooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_classroom ON public.classroom_attendance(classroom_id);
CREATE INDEX IF NOT EXISTS idx_polls_classroom ON public.classroom_polls(classroom_id);

ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_poll_votes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Classroom members can view classroom" ON public.classrooms;
  CREATE POLICY "Classroom members can view classroom" ON public.classrooms FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Teacher can manage classroom" ON public.classrooms;
  CREATE POLICY "Teacher can manage classroom" ON public.classrooms FOR ALL USING (auth.uid() = teacher_id);
  DROP POLICY IF EXISTS "Attendance viewable by participants" ON public.classroom_attendance;
  CREATE POLICY "Attendance viewable by participants" ON public.classroom_attendance FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Polls viewable by classroom members" ON public.classroom_polls;
  CREATE POLICY "Polls viewable by classroom members" ON public.classroom_polls FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Poll votes viewable by members" ON public.classroom_poll_votes;
  CREATE POLICY "Poll votes viewable by members" ON public.classroom_poll_votes FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Students can vote once" ON public.classroom_poll_votes;
  CREATE POLICY "Students can vote once" ON public.classroom_poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
EXCEPTION WHEN undefined_object THEN null; END $$;

-- --------------------------------------------------------------------
-- 10. REMOTE SUPPORT SESSIONS (009_support_sessions.sql)
-- --------------------------------------------------------------------
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

CREATE TABLE IF NOT EXISTS public.support_annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  support_session_id UUID NOT NULL REFERENCES public.support_sessions(id) ON DELETE CASCADE,
  x_ratio FLOAT NOT NULL,
  y_ratio FLOAT NOT NULL,
  label VARCHAR(100),
  technician_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_support_sessions_code ON public.support_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_support_annotations_session ON public.support_annotations(support_session_id);

ALTER TABLE public.support_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_annotations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Participants can view support session" ON public.support_sessions;
  CREATE POLICY "Participants can view support session" ON public.support_sessions FOR SELECT 
    USING (auth.uid() = customer_id OR auth.uid() = technician_id OR auth.uid() IS NULL);
  DROP POLICY IF EXISTS "Participants can view annotations" ON public.support_annotations;
  CREATE POLICY "Participants can view annotations" ON public.support_annotations FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Technician can create annotations" ON public.support_annotations;
  CREATE POLICY "Technician can create annotations" ON public.support_annotations FOR INSERT WITH CHECK (true);
EXCEPTION WHEN undefined_object THEN null; END $$;

-- --------------------------------------------------------------------
-- 11. ROOM HISTORY (010_room_history.sql)
-- --------------------------------------------------------------------
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

DO $$ BEGIN
  DROP POLICY IF EXISTS "Room history is viewable by everyone" ON public.room_history;
  CREATE POLICY "Room history is viewable by everyone" ON public.room_history FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Service or authenticated users can insert room history" ON public.room_history;
  CREATE POLICY "Service or authenticated users can insert room history" ON public.room_history FOR INSERT WITH CHECK (true);
EXCEPTION WHEN undefined_object THEN null; END $$;
