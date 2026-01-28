
from web3 import Web3
import json
import os

GANACHE_URL = "http://127.0.0.1:7545"
ADMIN_ACCOUNT = "0xF554e0De3a76D64b41f1A22db74C4B55079Be859"

try:
    w3 = Web3(Web3.HTTPProvider(GANACHE_URL))
    w3.eth.default_account = ADMIN_ACCOUNT

    with open("artifacts/contracts/Voting.sol/VotingSystem.json") as f:
        contract_json = json.load(f)
        abi = contract_json["abi"]
        bytecode = contract_json["bytecode"]

    print("Deploying Contract...")
    VotingContract = w3.eth.contract(abi=abi, bytecode=bytecode)
    
    # Deploy
    tx_hash = VotingContract.constructor("Tamil Nadu State Election 2026").transact()
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    
    address = tx_receipt.contractAddress
    print(f"Contract Deployed At: {address}")
    
    # Save address
    with open("contract_address.txt", "w") as f:
        f.write(address)
        
    print("Address saved to contract_address.txt")

except Exception as e:
    print(f"Deployment Failed: {e}")
