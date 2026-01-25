
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from backend.config.settings import MONGO_URI, DB_NAME

async def init_db():
    print("Connecting to MongoDB for initialization...")
    try:
        client = AsyncIOMotorClient(MONGO_URI)
        db = client[DB_NAME]
        
        # 1. Users Collection (Voters & Admins)
        # Structure: { username, password, voterId, role, hasVoted }
        print("Creating User Indexes...")
        await db["users"].create_index("voterId", unique=True)
        await db["users"].create_index("username", unique=True, sparse=True)

        # 2. Parties Collection
        # Structure: { name, symbol, description, manifesto, votes }
        print("Creating Party Indexes...")
        await db["parties"].create_index("name", unique=True)

        # 3. Votes Collection (The Ledger)
        # Structure: { userId, partyName, timestamp, boothId, hash }
        print("Creating Vote Indexes...")
        await db["votes"].create_index("userId", unique=True) # One vote per user

        # 4. Global State (Settings)
        # Structure: { _id: "global_state", electionSettings: {...} }
        # No index needed, singleton document.

        print("✅ Database Structure & Indexes Initialized Successfully!")
        
    except Exception as e:
        print(f"❌ Database Initialization Failed: {e}")

if __name__ == "__main__":
    asyncio.run(init_db())
