-- This script sets up the database for the Watch Party feature.
-- It uses prefixed table names to avoid conflicts with other applications.

-- For users who have already run the script, run this command to update the table:
-- ALTER TABLE public.watch_party_rooms ALTER COLUMN video_url DROP NOT NULL;

-- 1. Create the table for watch party rooms
CREATE TABLE public.watch_party_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  room_code character varying(6) NOT NULL,
  video_url text,
  playback_status text NOT NULL DEFAULT 'unstarted'::text,
  CONSTRAINT watch_party_rooms_pkey PRIMARY KEY (id),
  CONSTRAINT watch_party_rooms_room_code_key UNIQUE (room_code)
);
COMMENT ON TABLE public.watch_party_rooms IS 'Stores information about watch party rooms.';

-- 2. Create the table for watch party chat messages
CREATE TABLE public.watch_party_chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  author_name text NOT NULL,
  text text NOT NULL,
  CONSTRAINT watch_party_chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT watch_party_chat_messages_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.watch_party_rooms (id) ON DELETE CASCADE,
  CONSTRAINT watch_party_chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);
COMMENT ON TABLE public.watch_party_chat_messages IS 'Stores chat messages for watch party rooms.';

-- 3. Enable Row Level Security (RLS) for the new tables
ALTER TABLE public.watch_party_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_party_chat_messages ENABLE ROW LEVEL SECURITY;

-- 4. Create Security Policies for 'watch_party_rooms' table
CREATE POLICY "Allow authenticated users to create watch party rooms"
ON public.watch_party_rooms FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view watch party rooms"
ON public.watch_party_rooms FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to update video url"
ON public.watch_party_rooms FOR UPDATE TO authenticated USING (true);

-- 5. Create Security Policies for 'watch_party_chat_messages' table
CREATE POLICY "Allow authenticated users to send watch party messages"
ON public.watch_party_chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to view watch party messages"
ON public.watch_party_chat_messages FOR SELECT TO authenticated USING (true);

-- 6. Enable Realtime functionality for the chat table
-- This allows the app to listen for new messages instantly.
alter publication supabase_realtime add table public.watch_party_chat_messages;

-- 7. Create the table for video history
CREATE TABLE public.watch_party_video_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  video_url text NOT NULL,
  CONSTRAINT watch_party_video_history_pkey PRIMARY KEY (id),
  CONSTRAINT watch_party_video_history_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.watch_party_rooms (id) ON DELETE CASCADE,
  CONSTRAINT watch_party_video_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);
COMMENT ON TABLE public.watch_party_video_history IS 'Stores the history of videos played in a room.';

-- 8. Enable RLS for the history table
ALTER TABLE public.watch_party_video_history ENABLE ROW LEVEL SECURITY;

-- 9. Create Security Policies for 'watch_party_video_history'
CREATE POLICY "Allow authenticated users to add to video history"
ON public.watch_party_video_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to view video history for their room"
ON public.watch_party_video_history FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.watch_party_rooms
    WHERE watch_party_rooms.id = watch_party_video_history.room_id
  )
);

-- 10. Enable Realtime for the history table
alter publication supabase_realtime add table public.watch_party_video_history;