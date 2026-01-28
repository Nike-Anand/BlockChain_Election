import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables explicitly from .env in the same directory
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("❌ Error: SUPABASE_URL or SUPABASE_KEY not found in .env")
    exit(1)

print(f"Connecting to Supabase at: {url}")

try:
    supabase: Client = create_client(url, key)
    # Try a simple query - assuming 'settings' table exists as seen in app.py
    # or just check if we can query anything. 'users' is also used in app.py.
    # We'll try to select 1 item from 'settings' which is likely small.
    # Check users table
    response = supabase.table("users").select("*").limit(1).execute()
    
    print("✅ Successfully connected to Supabase!")
    if response.data:
        user = response.data[0]
        print("Fetched Admin/User data:", user)
        if "pass1" in user:
            print("✅ 'pass1' column exists in 'users' table.")
        else:
            print("❌ 'pass1' column MISSING in 'users' table.")
    else:
        print("Connected, but 'users' table is empty.")
        
except Exception as e:
    print(f"❌ Failed to connect to Supabase: {e}")
