-- Enable Election Polling
-- Run this in your Supabase SQL Editor to activate the election

UPDATE public.settings 
SET is_active = true 
WHERE id = 1;

-- Verify the change
SELECT id, is_active, registration_open, start_time, end_time 
FROM public.settings;
