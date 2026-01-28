from web3 import Web3
import os
import json

GANACHE_URL = "http://127.0.0.1:7545"
ADMIN_ACCOUNT_APP = "0xF554e0De3a76D64b41f1A22db74C4B55079Be859"

def check():
    w3 = Web3(Web3.HTTPProvider(GANACHE_URL))
    if not w3.is_connected():
        print("Failed to connect to Ganache")
        return

    print(f"Connected to Ganache: {w3.client_version}")
    accounts = w3.eth.accounts
    print(f"Available Accounts: {len(accounts)}")
    
    if ADMIN_ACCOUNT_APP in accounts:
        print(f"ADMIN_ACCOUNT {ADMIN_ACCOUNT_APP} IS VALID and available.")
    else:
        print(f"ADMIN_ACCOUNT {ADMIN_ACCOUNT_APP} is NOT in the current Ganache accounts.")
        print(f"First available account: {accounts[0]}")
    
    # Check Contract
    if os.path.exists("contract_address.txt"):
        with open("contract_address.txt", "r") as f:
            addr = f.read().strip()
            print(f"Contract Address from file: {addr}")
            
            code = w3.eth.get_code(addr)
            if len(code) > 0 and code != b'\x00':
                print("Contract Code: PRESENT (Contract exists)")
                
                # Check Candidates
                with open("artifacts/contracts/Voting.sol/VotingSystem.json") as jf:
                     abi = json.load(jf)["abi"]
                
                c = w3.eth.contract(address=addr, abi=abi)
                count = c.functions.candidatesCount().call()
                print(f"Candidates in Contract: {count}")
                if count == 0:
                    print("WARNING: No candidates in contract. Voting will fail.")
                else:
                    # List them
                    for i in range(1, count + 1):
                        cand = c.functions.candidates(i).call()
                        print(f" - Candidate {i}: {cand}")
                
                # Check Specific Voter
                voter_id = "XOE1854504"
                has_voted = c.functions.voters(voter_id).call()
                print(f"Has {voter_id} voted on chain? {has_voted}")
            else:
                print("Contract Code: EMPTY (Contract does NOT exist on this chain instance)")
    else:
        print("contract_address.txt not found.")

if __name__ == "__main__":
    check()
