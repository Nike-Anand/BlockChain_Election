from web3 import Web3
from solcx import compile_standard, install_solc
import json
import os

# Install solc compiler
install_solc('0.8.19')

GANACHE_URL = "http://127.0.0.1:7545"

try:
    # Connect to Ganache
    w3 = Web3(Web3.HTTPProvider(GANACHE_URL))
    
    # Verify connection
    if not w3.is_connected():
        raise Exception("Failed to connect to Ganache. Make sure it's running on http://127.0.0.1:7545")
    
    # Get the first account from Ganache
    accounts = w3.eth.accounts
    if not accounts:
        raise Exception("No accounts found in Ganache")
    
    ADMIN_ACCOUNT = accounts[0]
    print(f"Using account: {ADMIN_ACCOUNT}")
    w3.eth.default_account = ADMIN_ACCOUNT

    # Read the contract source
    with open("contracts/Voting.sol", "r") as file:
        contract_source = file.read()

    # Compile the contract
    print("Compiling contract...")
    compiled_sol = compile_standard(
        {
            "language": "Solidity",
            "sources": {"Voting.sol": {"content": contract_source}},
            "settings": {
                "outputSelection": {
                    "*": {
                        "*": ["abi", "metadata", "evm.bytecode", "evm.sourceMap"]
                    }
                }
            },
        },
        solc_version="0.8.19",
    )

    # Extract ABI and bytecode
    contract_interface = compiled_sol['contracts']['Voting.sol']['VotingSystem']
    abi = contract_interface['abi']
    bytecode = contract_interface['evm']['bytecode']['object']

    # Save ABI for backend use
    os.makedirs("artifacts/contracts/Voting.sol", exist_ok=True)
    with open("artifacts/contracts/Voting.sol/VotingSystem.json", "w") as f:
        json.dump({"abi": abi, "bytecode": bytecode}, f, indent=2)

    print("Deploying Contract...")
    VotingContract = w3.eth.contract(abi=abi, bytecode=bytecode)
    
    # Deploy
    tx_hash = VotingContract.constructor("Tamil Nadu State Election 2026").transact()
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    
    address = tx_receipt.contractAddress
    print(f"✅ Contract Deployed At: {address}")
    
    # Save address
    with open("contract_address.txt", "w") as f:
        f.write(address)
    
    print(f"✅ Contract address saved to contract_address.txt")
    print(f"✅ ABI saved to artifacts/contracts/Voting.sol/VotingSystem.json")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
