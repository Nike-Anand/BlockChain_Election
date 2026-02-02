from web3 import Web3
import os
import json

GANACHE_URL = "http://127.0.0.1:7545"
w3 = Web3(Web3.HTTPProvider(GANACHE_URL))

if w3.is_connected():
    print(f"✅ Connected to Ganache at {GANACHE_URL}")
    print(f"Accounts: {w3.eth.accounts}")
    
    if os.path.exists("contract_address.txt"):
        with open("contract_address.txt", "r") as f:
            addr = f.read().strip()
            print(f"Tracked Contract Address: {addr}")
            
            # Check if code exists at address
            code = w3.eth.get_code(addr)
            if code and code != w3.to_bytes(hexstr='0x00'):
                print("✅ Contract is deployed at this address")
            else:
                print("❌ No contract code found at this address. Needs redeploy.")
    else:
        print("❌ no contract_address.txt found")
else:
    print(f"❌ Could not connect to Ganache at {GANACHE_URL}. Trying 8545...")
    GANACHE_URL = "http://127.0.0.1:8545"
    w3 = Web3(Web3.HTTPProvider(GANACHE_URL))
    if w3.is_connected():
        print(f"✅ Connected to Ganache at {GANACHE_URL}")
    else:
        print("❌ Could not connect to Ganache on 7545 or 8545.")
