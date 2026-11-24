-- ====================================================================
-- Migration: 008_classrooms.sql
-- Description: Interactive education, attendance, course modules & polls
-- ====================================================================

-- Classrooms Table
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

-- Attendance Table
CREATE TABLE IF NOT EXISTS public.classroom_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  student_name VARCHAR(100) NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL,
  left_at TIMESTAMPTZ,
  duration_seconds INT DEFAULT 0
);

-- Polls Table
CREATE TABLE IF NOT EXISTS public.classroom_polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- e.g. ["Option A", "Option B"]
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Poll Votes Table
CREATE TABLE IF NOT EXISTS public.classroom_poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES public.classroom_polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  option_index INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_poll_user UNIQUE(poll_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_classrooms_teacher ON public.classrooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_classroom ON public.classroom_attendance(classroom_id);
CREATE INDEX IF NOT EXISTS idx_polls_classroom ON public.classroom_polls(classroom_id);

-- Enable RLS
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Classrooms viewable by everyone" ON public.classrooms FOR SELECT USING (true);
CREATE POLICY "Teachers can manage classrooms" ON public.classrooms FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Attendance viewable by teacher" ON public.classroom_attendance FOR SELECT USING (true);
CREATE POLICY "Polls viewable by students" ON public.classroom_polls FOR SELECT USING (true);
CREATE POLICY "Students can vote on polls" ON public.classroom_poll_votes FOR ALL USING (true);
