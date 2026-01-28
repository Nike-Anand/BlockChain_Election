
from supabase import create_client
import os
from dotenv import load_dotenv

# Path to backend/.env
env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
load_dotenv(env_path)

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: Missing SUPABASE_URL or SUPABASE_KEY")
    exit(1)

supabase = create_client(url, key)

def clear_table(table_name):
    try:
        print(f"Clearing {table_name}...")
        # Get all IDs
        res = supabase.table(table_name).select("id").execute()
        if not res.data:
            print(f"  {table_name} is already empty.")
            return

        # Delete in batches or one by one if delete-all not supported directly
        ids = [row['id'] for row in res.data]
        for aid in ids:
             supabase.table(table_name).delete().eq("id", aid).execute()
        
        print(f"  {table_name} cleared ({len(ids)} rows).")
    except Exception as e:
        print(f"  Error clearing {table_name}: {e}")

# Clear votes first (foreign keys)
clear_table("votes")
clear_table("parties")
# We might want to keep the admin user, but the user said "remove all".
# I'll clear users too, then we can seed one admin.
clear_table("users")

print("Database reset complete.")
