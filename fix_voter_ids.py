
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

print("Cleaning trailing spaces from Voter IDs...")
users = supabase.table("users").select("id, voter_id").execute().data

for u in users:
    original = u['voter_id']
    clean = original.strip()
    
    if original != clean:
        print(f"Fixing '{original}' -> '{clean}'")
        supabase.table("users").update({"voter_id": clean}).eq("id", u['id']).execute()
    else:
        # print(f"Skipping {original} (Clean)")
        pass

print("Done.")
