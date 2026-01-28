
from supabase import create_client
import os
from dotenv import load_dotenv

# Env Load
load_dotenv('backend/.env')
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

voter_id = 'KCX2739035'

print(f"Checking for Voter ID: {voter_id}...")
try:
    res = supabase.table("users").select("*").eq("voter_id", voter_id).execute()
    data = res.data
    
    if data and len(data) > 0:
        print(f"✅ Found User: {data[0]['username']}")
        if data[0].get('photo_base64'):
            print("✅ Photo is registered.")
            print(f"Photo Data: {data[0]['photo_base64'][:30]}...")
        else:
            print("❌ NO PHOTO registered for this user.")
    else:
        print(f"❌ User '{voter_id}' NOT FOUND in Supabase 'users' table.")
        
    # List all users just in case
    print("\n--- All Registered Users ---")
    all_users = supabase.table("users").select("voter_id, username").execute().data
    for u in all_users:
        print(f"- {u['voter_id']} ({u['username']})")
        
except Exception as e:
    print(f"Error: {e}")
