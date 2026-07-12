-- ============================================================
-- Pothole Reporter: Supabase Database Setup
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add resolved_by and resolved_at columns to reports table
-- (Skip if they already exist)
ALTER TABLE public.reports
    ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;


-- 2. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL CHECK (role IN ('citizen', 'authority')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);


-- 3. Auto-create a profile row when a new user signs up
--    SECURITY: The role in user_metadata is set by the backend's /auth/register endpoint
--    which validates an invite code before allowing 'authority'. Direct Supabase SDK calls
--    that omit the role will default to 'citizen'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'citizen')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if re-running
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 4. Copy role into app_metadata so it's embedded in the JWT
--    (app_metadata can't be modified by the client SDK)
CREATE OR REPLACE FUNCTION public.set_app_metadata_role()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object('role', COALESCE(NEW.raw_user_meta_data->>'role', 'citizen'))
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_set_role ON auth.users;
CREATE TRIGGER on_auth_user_created_set_role
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.set_app_metadata_role();


-- 5. Row Level Security for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);


-- 6. Create the avatars storage bucket (run separately if needed)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('avatars', 'avatars', true)
-- ON CONFLICT (id) DO NOTHING;
