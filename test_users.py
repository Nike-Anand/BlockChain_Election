
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

users = supabase.table("users").select("voter_id, username, role").execute().data
print("Users in DB:")
for u in users:
    print(f"- {u['voter_id']} ({u['username']}): {u['role']}")
