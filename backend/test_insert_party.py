import os
from dotenv import load_dotenv
from supabase import create_client, Client
import random

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("❌ Error: SUPABASE_URL or SUPABASE_KEY not found in .env")
    exit(1)

print(f"Connecting to Supabase at: {url}")
supabase: Client = create_client(url, key)

# Debug: Print the key type (just checking first few chars)
print(f"Using Key starting with: {key[:10]}...")

try:
    # Attempt to insert a random test party
    party_name = f"Test Party {random.randint(1000, 9999)}"
    data = {
        "name": party_name,
        "symbol": "🧪",
        "description": "A test party created by the debug script",
        "manifesto": "Test Manifesto",
        "image_url": "https://example.com/test.png",
        "votes": 0
    }
    
    print(f"Attempting to insert: {data['name']}")
    response = supabase.table("parties").insert(data).execute()
    
    print("✅ Insert Successful!")
    print("Response Data:", response.data)

except Exception as e:
    print(f"❌ Insert Failed: {e}")
    # Print more details if available
    if hasattr(e, 'code'):
        print(f"Error Code: {e.code}")
    if hasattr(e, 'details'):
        print(f"Error Details: {e.details}")
    if hasattr(e, 'message'):
        print(f"Error Message: {e.message}")
