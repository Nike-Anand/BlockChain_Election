
from web3 import Web3
import json
import os
import uuid as uuid_lib
from supabase import create_client
from dotenv import load_dotenv

# Env Load
load_dotenv('backend/.env')
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

# Web3 Config
GANACHE_URL = "http://127.0.0.1:7545"

try:
    w3 = Web3(Web3.HTTPProvider(GANACHE_URL))
    
    # Get the first account from Ganache (automatically available)
    accounts = w3.eth.accounts
    if not accounts:
        raise Exception("No accounts found in Ganache")
    
    ADMIN_ACCOUNT = accounts[0]
    print(f"Using Ganache account: {ADMIN_ACCOUNT}")
    w3.eth.default_account = ADMIN_ACCOUNT

    with open("artifacts/contracts/Voting.sol/VotingSystem.json") as f:
        contract_json = json.load(f)
        abi = contract_json["abi"]

    with open("contract_address.txt", "r") as f:
        contract_address = f.read().strip()

    contract = w3.eth.contract(address=contract_address, abi=abi)
    print(f"Connected to Contract at {contract_address}")

    # Fetch Parties from DB
    print("Fetching parties from Supabase...")
    parties = supabase.table("parties").select("*").order("id").execute().data

    print(f"Found {len(parties)} parties.")
    
    # Get current candidates count from Chain
    candidates_count = contract.functions.candidatesCount().call()
    print(f"Current Candidates on Chain: {candidates_count}")

    if candidates_count < len(parties):
        print("Syncing Candidates...")
        for i, party in enumerate(parties):
            if (i + 1) <= candidates_count:
                print(f"Skipping {party['name']} (Already on chain)")
                continue

            # Ensure party has UUID
            party_uuid = party.get('uuid')
            if not party_uuid:
                party_uuid = str(uuid_lib.uuid4())
                supabase.table("parties").update({"uuid": party_uuid}).eq("id", party['id']).execute()
                print(f"Generated UUID for {party['name']}: {party_uuid}")
            
            print(f"Adding {party['name']} with UUID {party_uuid}...")
            # New contract signature: addCandidate(name, uuid)
            tx_hash = contract.functions.addCandidate(party['name'], party_uuid).transact()
            w3.eth.wait_for_transaction_receipt(tx_hash)
            print(f"  -> Added. TX: {w3.to_hex(tx_hash)}")
    else:
        print("All parties already synced.")

    print("✅ Sync Complete.")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

