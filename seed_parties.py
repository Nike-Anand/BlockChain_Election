
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

parties = [
    {
        "name": "Dravida Munnetra Kazhagam (DMK)",
        "symbol": "☀️",
        "description": "Dravidian model of governance focused on Social Justice, Equality, and State Autonomy. Leading the Secular Progressive Alliance.",
        "manifesto": "1. State Autonomy\n2. Social Justice & Equality\n3. Women's Rights & Empowerment\n4. Education & Health for All\n5. Economic Development & Industrial Growth",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/e/ee/Flag_DMK.svg",
        "votes": 0
    },
    {
        "name": "All India Anna Dravida Munnetra Kazhagam (AIADMK)",
        "symbol": "🍃",
        "description": "Working for the welfare of the poor and downtrodden, following the path of Puratchi Thalaivar MGR and Puratchi Thalaivi Amma.",
        "manifesto": "1. Welfare Schemes for Women\n2. Free Education & Laptops\n3. Protecting State Rights\n4. Infrastructure Development\n5. Farmer Welfare",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/1/1d/AIADMK_Flag.svg",
        "votes": 0
    },
    {
        "name": "Tamizhaga Vettri Kazhagam (TVK)",
        "symbol": "🐘",
        "description": "Working for the welfare of the people of Tamil Nadu",
        "manifesto": "1. Victory for Tamil Nadu\n2. Welfare for All",
        "image_url": "https://upload.wikimedia.org/wikipedia/en/2/29/Tamilaga_Vettri_Kazhagam_Flag.svg",
        "votes": 0
    }
]

print("Seeding parties...")
for party in parties:
    try:
        # Check if exists
        existing = supabase.table("parties").select("*").eq("name", party["name"]).execute()
        if not existing.data:
            data = supabase.table("parties").insert(party).execute()
            print(f"Added: {party['name']}")
        else:
            print(f"Skipped (Already exists): {party['name']}")
            
    except Exception as e:
        print(f"Error adding {party['name']}: {e}")

print("Done.")
