
from web3 import Web3
import json
import os
from supabase import create_client
from dotenv import load_dotenv

# Env Load
load_dotenv('backend/.env')
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

# Web3 Config
GANACHE_URL = "http://127.0.0.1:7545"
ADMIN_ACCOUNT = "0xF554e0De3a76D64b41f1A22db74C4B55079Be859"

try:
    w3 = Web3(Web3.HTTPProvider(GANACHE_URL))
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
    # Order by ID to ensure consistent indices (1, 2, 3...)
    parties = supabase.table("parties").select("*").order("id").execute().data

    print(f"Found {len(parties)} parties.")
    
    # Get current candidates count from Chain to avoid duplicates if re-run
    candidates_count = contract.functions.candidatesCount().call()
    print(f"Current Candidates on Chain: {candidates_count}")

    if candidates_count < len(parties):
        print("Syncing Candidates...")
        for i, party in enumerate(parties):
            # i+1 is the expected ID if we started from 0, but let's just add them.
            # We skip if index < candidates_count (already added)
            if (i + 1) <= candidates_count:
                print(f"Skipping {party['name']} (Already on chain)")
                continue

            print(f"Adding {party['name']}...")
            tx_hash = contract.functions.addCandidate(party['name']).transact()
            w3.eth.wait_for_transaction_receipt(tx_hash)
            print(f"  -> Added. TX: {w3.to_hex(tx_hash)}")
    else:
        print("All parties already synced.")

    print("Sync Complete.")

except Exception as e:
    print(f"Error: {e}")
