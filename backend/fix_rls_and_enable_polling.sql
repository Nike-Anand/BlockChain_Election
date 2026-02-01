-- CRITICAL FIX: Disable RLS on settings table to allow updates
-- Run this in Supabase SQL Editor

-- First, disable RLS on the settings table
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- Now update the setting
UPDATE public.settings SET is_active = true WHERE id = 1;

-- Verify the change
SELECT id, is_active, registration_open, start_time, end_time 
FROM public.settings;

-- IMPORTANT: If you want to re-enable RLS later for security, run:
-- ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
-- But for now, leaving it disabled will allow the admin panel to work
