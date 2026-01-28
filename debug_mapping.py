from supabase import create_client
import os
from dotenv import load_dotenv
from web3 import Web3
import json

load_dotenv('backend/.env')
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

GANACHE_URL = "http://127.0.0.1:7545"
w3 = Web3(Web3.HTTPProvider(GANACHE_URL))
with open("artifacts/contracts/Voting.sol/VotingSystem.json") as f:
    abi = json.load(f)["abi"]
with open("contract_address.txt", "r") as f:
    addr = f.read().strip()
contract = w3.eth.contract(address=addr, abi=abi)

print("--- DB Parties (Ordered by ID) ---")
# Replicating app.py logic
parties = supabase.table("parties").select("name,id").order("id").execute().data
for i, p in enumerate(parties):
    print(f"Index {i} -> ID {i+1} : {p['name']} ({p['id']})")

print("\n--- Blockchain Candidates ---")
count = contract.functions.candidatesCount().call()
for i in range(1, count + 1):
    c = contract.functions.candidates(i).call()
    print(f"ID {c[0]} : {c[1]} (Votes: {c[2]})")

print("\n--- MAPPING CHECK ---")
for i, p in enumerate(parties):
    db_name = p['name']
    mapped_id = i + 1
    
    # Check what this maps to on chain
    if mapped_id <= count:
        chain_c = contract.functions.candidates(mapped_id).call()
        chain_name = chain_c[1]
        
        status = "MATCH" if db_name == chain_name else "MISMATCH !!!"
        print(f"DB '{db_name}' -> Maps to ID {mapped_id} -> Chain '{chain_name}' : [{status}]")
    else:
        print(f"DB '{db_name}' -> Maps to ID {mapped_id} -> NO CHAIN CANDIDATE")
