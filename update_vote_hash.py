from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

VOTER = "XOE1854504"
HASH = "0xdf426a25f0232208d1220a5a5f989b7fcee58ee2239c482372ae80c120932f99"

print(f"Updating vote for {VOTER}...")

# Check if row exists
res = supabase.table("votes").select("*").eq("user_id", VOTER).execute()
if res.data:
    print("Found vote record. Updating hash...")
    supabase.table("votes").update({"tx_hash": HASH}).eq("user_id", VOTER).execute()
    print("Update Success.")
else:
    print("No vote record found in DB to update!")
