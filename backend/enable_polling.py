"""
Quick script to enable election polling in Supabase
Run this to activate the election
"""

from supabase import create_client
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Try both keys - the .env one and the one from Flutter app
SUPABASE_URL = "https://vvyuhplekvizscvovral.supabase.co"

# This is the service role key that should have write permissions
# If the .env key doesn't work, we'll use the anon key from the Flutter app
env_key = os.getenv("SUPABASE_KEY")
flutter_anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2eXVocGxla3ZpenNjdm92cmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNzQwNzEsImV4cCI6MjA4NDg1MDA3MX0.BugWw5SlEICo2UXDe-pBuvoLJbLSaUJjzKr4tilTnSc"

print(f"Connecting to Supabase: {SUPABASE_URL}")
print(f"Using key from .env: {env_key[:20]}..." if env_key else "No key in .env")

# Try with the Flutter anon key (which we know works for the app)
SUPABASE_KEY = flutter_anon_key
print(f"Using Flutter anon key: {SUPABASE_KEY[:20]}...")

# Connect to Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Get current settings
print("\n=== Current Settings ===")
try:
    current = supabase.table("settings").select("*").execute()
    if current.data:
        print(f"is_active: {current.data[0].get('is_active')}")
        print(f"registration_open: {current.data[0].get('registration_open')}")
        print(f"start_time: {current.data[0].get('start_time')}")
        print(f"end_time: {current.data[0].get('end_time')}")
    else:
        print("No settings found!")
except Exception as e:
    print(f"❌ Error reading settings: {e}")
    exit(1)

# Update to enable polling
print("\n=== Updating Settings ===")
try:
    result = supabase.table("settings").update({"is_active": True}).eq("id", 1).execute()
    
    if result.data:
        print("✅ Successfully updated settings!")
        print(f"is_active: {result.data[0].get('is_active')}")
    else:
        print("❌ Update returned no data - this might indicate a permission issue")
        print("You may need to use the service_role key instead of anon key")
except Exception as e:
    print(f"❌ Error updating settings: {e}")
    print("\nThis is likely a permissions issue.")
    print("The anon key has Row Level Security (RLS) restrictions.")
    print("\nPlease update manually in Supabase dashboard:")
    print("1. Go to SQL Editor")
    print("2. Run: UPDATE public.settings SET is_active = true WHERE id = 1;")
    exit(1)

# Verify the change
print("\n=== Verifying Update ===")
try:
    verify = supabase.table("settings").select("*").execute()
    if verify.data:
        print(f"is_active: {verify.data[0].get('is_active')}")
        if verify.data[0].get('is_active'):
            print("\n✅ POLLING IS NOW ACTIVE!")
        else:
            print("\n❌ POLLING IS STILL CLOSED - Update may have failed due to RLS policies")
except Exception as e:
    print(f"❌ Error verifying: {e}")
