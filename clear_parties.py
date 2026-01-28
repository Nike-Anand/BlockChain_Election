
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

try:
    print("Clearing all parties...")
    # Delete all rows where id is not null (effectively all rows)
    # We first need to get IDs to delete them, or use a not-null filter if supported by the policy/client
    # A common way to delete all is to select all IDs and delete them.
    
    response = supabase.table("parties").select("id").execute()
    data = response.data
    
    if not data:
        print("No parties to delete.")
    else:
        ids = [row['id'] for row in data]
        for party_id in ids:
            supabase.table("parties").delete().eq("id", party_id).execute()
        print(f"Deleted {len(ids)} parties.")

except Exception as e:
    print(f"Error: {e}")
