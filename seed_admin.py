
from supabase import create_client
import os
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
load_dotenv(env_path)

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

admin_user = {
    "username": "admin",
    "password": "123", # Matches the hardcoded expectation or can be anything
    "voter_id": "ADMIN",
    "role": "admin"
}

try:
    print("Creating Admin User...")
    existing = supabase.table("users").select("*").eq("username", "admin").execute()
    if not existing.data:
        supabase.table("users").insert(admin_user).execute()
        print("Admin user created.")
    else:
        print("Admin user already exists.")
except Exception as e:
    print(f"Error: {e}")
