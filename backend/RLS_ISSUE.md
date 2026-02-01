# Polling Status Issue - Root Cause Found

## The Problem

The Supabase update appears to succeed but doesn't persist. This is because of **Row Level Security (RLS) policies**.

## Root Cause

The `settings` table has RLS enabled (see `supabase_setup.sql` line 79), but the RLS policy allows reads for everyone but **may be blocking writes** for the anon key.

The policy at line 85 says:
```sql
create policy "Enable access for service role" on public.settings for all using (true) with check (true);
```

This policy is named "Enable access for service role" but it's actually allowing ALL operations. However, the anon key might not have sufficient permissions.

## Solution

You need to update the settings directly in the **Supabase Dashboard SQL Editor** because:

1. The anon key has limited permissions (by design for security)
2. The service role key is not in the `.env` file
3. The SQL Editor runs with admin privileges

## Steps to Fix

1. Go to your Supabase project: https://supabase.com/dashboard/project/vvyuhplekvizscvovral
2. Click "SQL Editor" in the left sidebar
3. Run this command:

```sql
UPDATE public.settings SET is_active = true WHERE id = 1;
```

4. Verify with:

```sql
SELECT * FROM public.settings;
```

5. Restart your Flutter app to fetch the updated settings

## Alternative: Add Service Role Key

If you want the Python script to work, add the service_role key to `.env`:

1. Go to Project Settings → API
2. Copy the `service_role` key (NOT the anon key)
3. Update `.env`:
   ```
   SUPABASE_KEY=<your-service-role-key-here>
   ```
