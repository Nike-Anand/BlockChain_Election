"""
Apply database schema updates for logic fixes
Run this after deploying the new smart contract
"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('backend/.env')
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

print("Applying database schema updates...")

# Note: Supabase Python client doesn't support DDL directly
# These updates need to be run in Supabase SQL Editor

sql_updates = """
-- Add UUID column to parties table
ALTER TABLE parties ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT uuid_generate_v4();
CREATE UNIQUE INDEX IF NOT EXISTS parties_uuid_idx ON parties(uuid);

-- Add vote_hash column to votes table
ALTER TABLE votes ADD COLUMN IF NOT EXISTS vote_hash TEXT;
CREATE INDEX IF NOT EXISTS votes_vote_hash_idx ON votes(vote_hash);

-- Create invalid_votes table
CREATE TABLE IF NOT EXISTS invalid_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tx_hash TEXT NOT NULL,
    voter_id TEXT NOT NULL,
    reason TEXT,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Update existing parties with UUIDs
UPDATE parties SET uuid = uuid_generate_v4() WHERE uuid IS NULL;
"""

print("\n" + "="*60)
print("IMPORTANT: Run the following SQL in Supabase SQL Editor:")
print("="*60)
print(sql_updates)
print("="*60)

# Generate UUIDs for existing parties (can do this via Python)
print("\nGenerating UUIDs for existing parties...")
try:
    import uuid as uuid_lib
    
    parties = supabase.table("parties").select("*").execute().data
    
    for party in parties:
        if not party.get('uuid'):
            party_uuid = str(uuid_lib.uuid4())
            try:
                supabase.table("parties").update({"uuid": party_uuid}).eq("id", party['id']).execute()
                print(f"✅ Generated UUID for {party['name']}: {party_uuid}")
            except Exception as e:
                print(f"⚠️  Could not update {party['name']}: {e}")
                print("   (This is expected if the uuid column doesn't exist yet)")
                print("   Please run the SQL above in Supabase SQL Editor first")
                break
    
    print("\n✅ UUID generation complete!")
    
except Exception as e:
    print(f"\n⚠️  Error: {e}")
    print("Please run the SQL script in Supabase SQL Editor first, then run this script again.")
