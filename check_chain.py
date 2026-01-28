
from web3 import Web3

# Ganache URL
ganache_url = "http://127.0.0.1:7545"

print(f"Connecting to Ganache at {ganache_url}...")
try:
    web3 = Web3(Web3.HTTPProvider(ganache_url))
    if web3.is_connected():
        print("Connected to Ganache!")
        print(f"Current Block Number: {web3.eth.block_number}")
        
        target_addr = "0xF554e0De3a76D64b41f1A22db74C4B55079Be859"
        
        # Check if address is valid checksum
        if not web3.is_checksum_address(target_addr):
            target_addr = web3.to_checksum_address(target_addr)
            
        balance = web3.eth.get_balance(target_addr)
        print(f"Balance of {target_addr}: {web3.from_wei(balance, 'ether')} ETH")
        
        # Check code to see if it's a contract
        code = web3.eth.get_code(target_addr)
        if len(code) > 2: # '0x' is empty
            print("Target is a deployed Smart Contract.")
        else:
            print("Target is an Externally Owned Account (EOA).")
            
    else:
        print("Failed to connect to Ganache.")
except Exception as e:
    print(f"Connection Error: {e}")
