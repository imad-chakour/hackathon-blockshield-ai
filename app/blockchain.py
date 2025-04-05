from web3 import Web3
from solcx import compile_standard

ganache_url = "http://127.0.0.1:7545"  # Connect to Ganache local blockchain for ethereum
web3 = Web3(Web3.HTTPProvider(ganache_url))
web3.eth.default_account = web3.eth.accounts[0]                  

with open("contracts/ThreatIntelligence.sol", "r") as file: # Read the smart contract
    contract_source_code = file.read()

compiled_sol = compile_standard(
    {
        "language": "Solidity",
        "sources": {"ThreatIntelligence.sol": {"content": contract_source_code}},
        "settings": {
            "outputSelection": {
                "*": {
                    "*": ["abi", "metadata", "evm.bytecode", "evm.sourceMap"]
                }
            }
        },
    },
    solc_version="0.8.0",
)

# Get bytecode and ABI
bytecode = compiled_sol["contracts"]["ThreatIntelligence.sol"]["ThreatIntelligence"]["evm"]["bytecode"]["object"]
abi = compiled_sol["contracts"]["ThreatIntelligence.sol"]["ThreatIntelligence"]["abi"]

# Deploy the contract
ThreatIntelligence = web3.eth.contract(abi=abi, bytecode=bytecode)
tx_hash = ThreatIntelligence.constructor().transact()
tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash)

# Contract instance
contract_instance = web3.eth.contract(address=tx_receipt.contractAddress, abi=abi)
print(f"Contract deployed at {tx_receipt.contractAddress}")

# Add a threat
tx_hash = contract_instance.functions.reportThreat("123", "Alice", "Blockchain Basics").transact()
web3.eth.wait_for_transaction_receipt(tx_hash)

# Verify a threat
result = contract_instance.functions.verifyThreat("123").call()
print(result)