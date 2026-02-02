from web3 import Web3
import os

GANACHE_URL = "http://127.0.0.1:7545"
w3 = Web3(Web3.HTTPProvider(GANACHE_URL))

if w3.is_connected():
    print(f"✅ Connected to Ganache: {GANACHE_URL}")
    print(f"Network ID: {w3.eth.chain_id}")
    print(f"Latest Block: {w3.eth.block_number}")
    print(f"Default Account: {w3.eth.accounts[0]}")
    
    # Check if we have a contract address file
    if os.path.exists("contract_address.txt"):
        with open("contract_address.txt", "r") as f:
            addr = f.read().strip()
            print(f"Tracked Address: {addr}")
            code = w3.eth.get_code(addr)
            if code and code != w3.to_bytes(hexstr='0x00'):
                print("✅ Contract is active on-chain.")
            else:
                print("⚠️  No code at tracked address.")
    else:
        print("❌ No contract_address.txt found.")
else:
    print("❌ Failed to connect to Ganache.")
