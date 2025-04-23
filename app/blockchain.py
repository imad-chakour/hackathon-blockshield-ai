import hashlib
import time
import json
import os
from pathlib import Path
from typing import Dict, Any, Optional
from web3 import Web3
from web3.contract import Contract
from web3.exceptions import ContractLogicError
from eth_account import Account
from eth_account.messages import encode_defunct
from app.models import ThreatReport
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BlockchainService:
    def __init__(self):
        # Configuration
        self.ganache_url = os.getenv('BLOCKCHAIN_URL', "http://127.0.0.1:7545")
        self.contract_name = "ThreatIntelligence"
        self.contract_file = "ThreatIntelligence.sol"
        self.build_dir = Path("build/contracts")
        
        # Initialize Web3 with connection timeout
        self.w3 = Web3(Web3.HTTPProvider(
            self.ganache_url,
            request_kwargs={'timeout': 5}  # 5 second timeout
        ))
        
        # Connection state
        self._is_connected = False
        self.last_connection_check = 0
        self.connection_check_interval = 5  # seconds
        
        try:
            # Initialize connection
            self._check_connection()
            
            # Load default account
            self.default_account = self._setup_account()
            self.contract = self._initialize_contract()
            
            logger.info(f"BlockchainService initialized successfully. Connected to {self.ganache_url}")
            logger.info(f"Default account: {self.default_account}")
            logger.info(f"Contract address: {self.contract.address}")
        except Exception as e:
            logger.error(f"Blockchain initialization failed: {str(e)}")
            raise ConnectionError(f"Failed to initialize blockchain service: {str(e)}")

    def _check_connection(self):
        """Internal method to verify and update connection status"""
        try:
            self._is_connected = self.w3.is_connected()
            self.last_connection_check = time.time()
            if not self._is_connected:
                raise ConnectionError("Not connected to blockchain")
        except Exception as e:
            self._is_connected = False
            raise ConnectionError(f"Connection check failed: {str(e)}")

    def is_connected(self) -> bool:
        """Public method to check connection status with caching"""
        current_time = time.time()
        if (current_time - self.last_connection_check) > self.connection_check_interval:
            try:
                self._check_connection()
            except Exception as e:
                logger.warning(f"Connection check failed: {str(e)}")
                self._is_connected = False
        return self._is_connected

    def _setup_account(self) -> str:
        """Setup the default account for transactions"""
        if not self.is_connected():
            raise ConnectionError("Blockchain not connected")
            
        if not self.w3.eth.accounts:
            raise ValueError("No accounts available in the network")
        
        # Use environment variable for private key if available
        if os.getenv('PRIVATE_KEY'):
            account = Account.from_key(os.getenv('PRIVATE_KEY'))
            self.w3.eth.default_account = account.address
            return account.address
        
        # Fallback to first account
        self.w3.eth.default_account = self.w3.eth.accounts[0]
        return self.w3.eth.accounts[0]

    def _compile_contract(self) -> Dict[str, Any]:
        """Compile the Solidity contract"""
        contracts_path = Path("contracts") / self.contract_file
        if not contracts_path.exists():
            raise FileNotFoundError(f"Contract file not found at {contracts_path}")
        
        with open(contracts_path, "r") as file:
            contract_source = file.read()
        
        compiled = self.w3.eth.compile_solidity(contract_source)
        contract_data = compiled[f"<stdin>:{self.contract_name}"]
        return {
            "abi": contract_data["abi"],
            "bytecode": contract_data["bin"]
        }

    def _deploy_contract(self, abi: str, bytecode: str) -> str:
        """Deploy the contract to the blockchain"""
        contract = self.w3.eth.contract(abi=abi, bytecode=bytecode)
        tx_hash = contract.constructor().transact({
            'from': self.default_account,
            'gas': 3000000
        })
        tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        return tx_receipt.contractAddress

    def _load_contract(self, address: str, abi: str) -> Contract:
        """Load an existing contract instance"""
        if not self.w3.is_address(address):
            raise ValueError(f"Invalid contract address: {address}")
        return self.w3.eth.contract(address=address, abi=abi)

    def _initialize_contract(self) -> Contract:
        """Initialize or deploy the contract"""
        self.build_dir.mkdir(parents=True, exist_ok=True)
        build_path = self.build_dir / f"{self.contract_name}.json"
        
        # Try to load existing deployment
        if build_path.exists():
            try:
                with open(build_path, "r") as f:
                    deployment = json.load(f)
                    return self._load_contract(deployment["address"], deployment["abi"])
            except Exception as e:
                logger.warning(f"Failed to load contract from build file: {str(e)}")
        
        # Compile and deploy new contract
        compiled = self._compile_contract()
        contract_address = self._deploy_contract(compiled["abi"], compiled["bytecode"])
        
        # Save deployment info
        deployment = {
            "address": contract_address,
            "abi": compiled["abi"],
            "deployer": self.default_account,
            "network": "ganache"
        }
        with open(build_path, "w") as f:
            json.dump(deployment, f)
        
        logger.info(f"Contract deployed at {contract_address}")
        return self._load_contract(contract_address, compiled["abi"])

    def _threat_id_to_bytes(self, threat_id: str) -> bytes:
        """Convert threat ID string to bytes32"""
        if not threat_id:
            raise ValueError("Threat ID cannot be empty")
        return Web3.keccak(text=threat_id)

    def report_threat(self, threat_id: str, url: str, threat_data: Dict) -> Dict:
        """Report a threat to the blockchain"""
        if not self.is_connected():
            raise ConnectionError("Blockchain not connected")

        try:
            # Validate threat ID format
            if not threat_id:
                raise ValueError("Threat ID cannot be empty")

            threat_id_bytes = self._threat_id_to_bytes(threat_id)
            confidence_percent = int(threat_data['confidence'] * 100)
            
            # Validate threat level (1-10)
            if not 1 <= threat_data['threat_level'] <= 10:
                raise ValueError("Threat level must be between 1 and 10")
            
            threat_id_bytes = Web3.keccak(text=threat_id)
        
            tx = self.contract.functions.reportThreat(
                threat_id_bytes,
                url,
                threat_data['threat_signature'],
                threat_data['threat_level'],
                confidence_percent,
                threat_data['is_malicious']
            ).build_transaction({
                'from': self.default_account,
                'gas': 200000,
                'nonce': self.w3.eth.get_transaction_count(self.default_account)
            })
            
            signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=os.getenv('PRIVATE_KEY'))
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            # Verify threat was recorded
            threat_recorded = self.contract.functions.threatExists(threat_id_bytes).call()
            if not threat_recorded:
                raise ValueError("Threat was not recorded on blockchain")
            
            return {
                "success": True,
                "threat_id": threat_id,
                "tx_hash": tx_hash.hex(),
                "block_number": receipt.blockNumber
            }
            
        except ContractLogicError as e:
            error_msg = str(e)
            if "Threat already reported" in error_msg:
                return {
                    "success": False,
                    "threat_id": threat_id,
                    "message": "Threat already exists on blockchain",
                    "error": "duplicate_threat"
                }
            logger.error(f"Contract logic error reporting threat {threat_id}: {error_msg}")
            return {
                "success": False,
                "threat_id": threat_id,
                "message": error_msg,
                "error": "contract_error"
            }
        except Exception as e:
            logger.error(f"Failed to report threat {threat_id}: {str(e)}")
            return {
                "success": False,
                "threat_id": threat_id,
                "message": str(e),
                "error": "report_error"
            }
        
    def verify_threat(self, threat_id: str) -> Dict[str, Any]:
        """Verify a threat on the blockchain"""
        try:
            threat_id_bytes = self._threat_id_to_bytes(threat_id)
            
            # Check threat exists
            if not self.contract.functions.threatExists(threat_id_bytes).call():
                raise ValueError("Threat does not exist")
            
            # Build verification transaction
            tx = self.contract.functions.verifyThreat(threat_id_bytes).build_transaction({
                'from': self.default_account,
                'gas': 200000,
                'nonce': self.w3.eth.get_transaction_count(self.default_account)
            })
            
            signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=os.getenv('PRIVATE_KEY'))
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            if receipt.status != 1:
                raise ValueError("Transaction failed")
            
            # Check verification status
            threat_info = self.contract.functions.getThreatInfo(threat_id_bytes).call()
            if not threat_info[7]:  # verified field
                raise ValueError("Verification failed")
            
            return {
                "success": True,
                "tx_hash": tx_hash.hex(),
                "threat_id": threat_id,
                "verified": True,
                "block_number": receipt.blockNumber
            }
            
        except Exception as e:
            logger.error(f"Verification failed for {threat_id}: {str(e)}")
            return {
                "success": False,
                "threat_id": threat_id,
                "message": str(e),
                "error": "verification_error"
            }

    def get_threat_info(self, threat_id: str) -> Optional[ThreatReport]:
        """Get threat information from blockchain"""
        try:
            threat_id_bytes = self._threat_id_to_bytes(threat_id)
            
            if not self.contract.functions.threatExists(threat_id_bytes).call():
                return None
                
            data = self.contract.functions.getThreatInfo(threat_id_bytes).call()
            
            return ThreatReport(
                reporter=data[0],
                url=data[1],
                threat_signature=data[2],
                threat_level=data[3],
                confidence=data[4] / 100,  # Convert back to decimal
                timestamp=data[5],
                is_malicious=data[6],
                verified=data[7],
                threat_id=threat_id
            )
            
        except Exception as e:
            logger.error(f"Failed to get threat info: {str(e)}")
            return None

    def threat_exists(self, threat_id: str) -> bool:
        """Check if a threat exists in the blockchain"""
        try:
            threat_id_bytes = self._threat_id_to_bytes(threat_id)
            return self.contract.functions.threatExists(threat_id_bytes).call()
        except Exception as e:
            logger.error(f"Error checking threat existence: {str(e)}")
            return False

    def get_all_threats(self) -> list[str]:
        """Get list of all threat IDs"""
        try:
            threat_ids_bytes = self.contract.functions.getAllThreats().call()
            return [Web3.to_hex(threat_id) for threat_id in threat_ids_bytes]
        except Exception as e:
            logger.error(f"Failed to get all threats: {str(e)}")
            return []

    def get_threats_count(self) -> int:
        """Get total number of threats recorded"""
        try:
            return self.contract.functions.getThreatsCount().call()
        except Exception as e:
            logger.error(f"Failed to get threats count: {str(e)}")
            return 0

    def get_service_status(self) -> Dict[str, Any]:
        """Return detailed service status"""
        return {
            "service": "Blockchain Service",
            "version": "1.0.0",
            "connected": self.is_connected(),
            "last_checked": self.last_connection_check,
            "network_id": self.w3.eth.chain_id if self.is_connected() else None,
            "default_account": self.default_account,
            "contract_address": self.contract.address if hasattr(self, 'contract') else None,
            "latest_block": self.w3.eth.block_number if self.is_connected() else None,
            "threats_count": self.get_threats_count()
        }

# Singleton instance
blockchain_service = BlockchainService()

def is_blockchain_connected() -> bool:
    """Wrapper for health check endpoint"""
    try:
        return blockchain_service.is_connected()
    except Exception as e:
        logger.error(f"Health check connection test failed: {str(e)}")
        return False