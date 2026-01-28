
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
    print(f"Fetching parties from {url}...")
    response = supabase.table("parties").select("*").execute()
    data = response.data
    print(f"Found {len(data)} parties:")
    for p in data:
        print(f"- {p.get('name')} (Votes: {p.get('votes')})")
except Exception as e:
    print(f"Error: {e}")
