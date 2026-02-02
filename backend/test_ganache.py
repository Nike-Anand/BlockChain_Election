from web3 import Web3
import json
import os

GANACHE_URL = "http://127.0.0.1:7545"
w3 = Web3(Web3.HTTPProvider(GANACHE_URL))

def test_ganache():
    print(f"--- Ganache Diagnostic ---")
    if not w3.is_connected():
        print(f"❌ FAILED: Cannot connect to Ganache at {GANACHE_URL}")
        print("Suggestion: Ensure Ganache GUI or 'ganache-cli' is running on port 7545.")
        return

    print(f"✅ SUCCESS: Connected to Ganache.")
    print(f"Network ID: {w3.eth.chain_id}")
    print(f"Current Block: {w3.eth.block_number}")
    
    accounts = w3.eth.accounts
    if accounts:
        print(f"Default Admin Account: {accounts[0]}")
        balance = w3.from_wei(w3.eth.get_balance(accounts[0]), 'ether')
        print(f"Admin Balance: {balance} ETH")
    else:
        print("⚠️  WARNING: No accounts found in Ganache.")

    # Check for contract
    if os.path.exists("contract_address.txt"):
        with open("contract_address.txt", "r") as f:
            addr = f.read().strip()
            print(f"Tracked Contract Address: {addr}")
            code = w3.eth.get_code(addr)
            if code and code != w3.to_bytes(hexstr='0x00'):
                print("✅ Contract is active on the blockchain.")
            else:
                print("⚠️  The contract address exists but it has NO CODE (Ganache might have been reset).")
    else:
        print("ℹ️  No contract deployed yet (app.py will auto-deploy on start).")

if __name__ == "__main__":
    test_ganache()
