-- ##########################################
-- PRAGYA YOG SCHOOL - DEFINITIVE RELEASE SCHEMA
-- ##########################################

-- 1. Users Table (Synchronized with Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('Instructor', 'Learner')),
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  location TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Posts Table (Discovery Feed)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT NOT NULL,
  caption TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Comments Table (Posts)
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Likes Table (Posts)
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 5. Messages Table (Mindful Dialogue)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tutorials Table (Sanctuary Reels)
CREATE TABLE IF NOT EXISTS public.tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  description TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  music_name TEXT DEFAULT 'Original Audio',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tutorial Likes & Comments (Reels Engagement)
CREATE TABLE IF NOT EXISTS public.tutorial_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutorial_id UUID REFERENCES public.tutorials(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tutorial_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.tutorial_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutorial_id UUID REFERENCES public.tutorials(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Follows Table (Member Connections)
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- ##########################################
-- RLS POLICIES (Row Level Security)
-- ##########################################

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorial_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorial_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Simplified policies for Sanctuary Release
CREATE POLICY "Public Read Access" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.tutorials FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.tutorial_likes FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.tutorial_comments FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.follows FOR SELECT USING (true);

-- Authenticated modifications
CREATE POLICY "Auth Update Profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Auth Post Wisdom" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth Send Message" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Auth Read Messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Auth Follow Others" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Auth Unfollow Others" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- ##########################################
-- DATABASE TRIGGERS (Automated Intelligence)
-- ##########################################

-- Trigger: Synchronize Auth Users to Public.Users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, role, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Pragya Yogi'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Learner'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Automated Counters (Likes & Comments)
CREATE OR REPLACE FUNCTION public.sync_counters()
RETURNS TRIGGER AS $$
BEGIN
  -- Likes Logic
  IF (TG_TABLE_NAME = 'likes') THEN
    IF (TG_OP = 'INSERT') THEN
      UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'DELETE') THEN
      UPDATE public.posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
    END IF;
  ELSIF (TG_TABLE_NAME = 'tutorial_likes') THEN
    IF (TG_OP = 'INSERT') THEN
      UPDATE public.tutorials SET likes_count = likes_count + 1 WHERE id = NEW.tutorial_id;
    ELSIF (TG_OP = 'DELETE') THEN
      UPDATE public.tutorials SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.tutorial_id;
    END IF;
  -- Comments Logic
  ELSIF (TG_TABLE_NAME = 'comments') THEN
    IF (TG_OP = 'INSERT') THEN
      UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'DELETE') THEN
      UPDATE public.posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
    END IF;
  ELSIF (TG_TABLE_NAME = 'tutorial_comments') THEN
    IF (TG_OP = 'INSERT') THEN
      UPDATE public.tutorials SET comments_count = comments_count + 1 WHERE id = NEW.tutorial_id;
    ELSIF (TG_OP = 'DELETE') THEN
      UPDATE public.tutorials SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.tutorial_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach Triggers to all engagement tables
CREATE TRIGGER sync_posts_likes AFTER INSERT OR DELETE ON public.likes FOR EACH ROW EXECUTE FUNCTION public.sync_counters();
CREATE TRIGGER sync_tutorials_likes AFTER INSERT OR DELETE ON public.tutorial_likes FOR EACH ROW EXECUTE FUNCTION public.sync_counters();
CREATE TRIGGER sync_posts_comments AFTER INSERT OR DELETE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.sync_counters();
CREATE TRIGGER sync_tutorials_comments AFTER INSERT OR DELETE ON public.tutorial_comments FOR EACH ROW EXECUTE FUNCTION public.sync_counters();
