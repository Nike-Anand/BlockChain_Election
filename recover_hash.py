from web3 import Web3
import json

GANACHE_URL = "http://127.0.0.1:7545"
TARGET_VOTER = "XOE1854504"

def recover():
    w3 = Web3(Web3.HTTPProvider(GANACHE_URL))
    if not w3.is_connected():
        print("Not connected.")
        return

    print("Scanning for transaction hash...")

    # Load ABI for decoding
    with open("artifacts/contracts/Voting.sol/VotingSystem.json") as f:
        contract_json = json.load(f)
        abi = contract_json["abi"]
    
    contract = w3.eth.contract(abi=abi)

    # Simple scan of recent blocks
    latest = w3.eth.block_number
    print(f"Latest Block: {latest}")

    found = False
    for i in range(latest, 0, -1):
        block = w3.eth.get_block(i, full_transactions=True)
        for tx in block.transactions:
            # Check if this tx is a function call to our contract
            try:
                # Decode
                func_obj, func_params = contract.decode_function_input(tx.input)
                if func_obj.fn_name == 'vote':
                    # Params: {'_candidateId': 1, '_epicNumber': 'XOE1854504'}
                    voter = func_params.get('_epicNumber')
                    cand_id = func_params.get('_candidateId')
                    
                    if voter == TARGET_VOTER:
                        print(f"FOUND MATCH!")
                        print(f"Block: {i}")
                        print(f"Voter: {voter}")
                        print(f"Candidate ID: {cand_id}")
                        print(f"TX HASH: {tx.hash.hex()}")
                        found = True
                        break
            except Exception as e:
                # Not a contract call we care about
                pass
        if found: break

    if not found:
        print("Could not find transaction for this voter in recent blocks.")

if __name__ == "__main__":
    recover()
