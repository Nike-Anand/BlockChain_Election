
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

print(f"URL: {url}")
print(f"KEY: {key}")

try:
    print("Attempting to connect...")
    supabase = create_client(url, key)
    print("Client created. Fetching 'settings' table...")
    res = supabase.table("settings").select("*").execute()
    print("Connection Successful!")
    print(f"Data: {res.data}")
except Exception as e:
    print(f"Connection Failed: {e}")
