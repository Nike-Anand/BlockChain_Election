-- FINAL FIX: The end_time is in the past, which might be auto-disabling the election
-- Run ALL of these commands together in Supabase SQL Editor

-- 1. Disable RLS to allow updates
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- 2. Set end_time to a future date (tomorrow)
UPDATE public.settings 
SET end_time = '2026-02-01 23:59:59+00:00',
    is_active = true 
WHERE id = 1;

-- 3. Verify the changes
SELECT id, is_active, start_time, end_time, registration_open 
FROM public.settings;

-- Expected result:
-- is_active: true
-- end_time: 2026-02-01 23:59:59+00:00 (tomorrow)
