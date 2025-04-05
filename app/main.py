from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
from datetime import datetime
from typing import Optional
from web3 import Web3
from app.blockchain import contract_instance, web3
from app.chat_bot import ChatRequest, assistant, CertificateAssistant
from app.metrics import setup_metrics, REQUEST_COUNT, REQUEST_DURATION

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="BlockShield AI API",
    description="API for AI-powered threat detection with blockchain verification",
    version="1.0.0"
)

# Setup metrics
metrics = setup_metrics(app)
REQUEST_COUNT = metrics["request_count"]
REQUEST_DURATION = metrics["request_duration"]

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ThreatReport(BaseModel):
    threat_data: str
    source_ip: Optional[str] = None
    threat_type: Optional[str] = None
    confidence: Optional[float] = None

class ThreatVerification(BaseModel):
    threat_id: str
    verified: bool
    analyst_notes: Optional[str] = None

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    REQUEST_COUNT.labels(method="POST", endpoint="/api/chat").inc()
    with REQUEST_DURATION.labels(method="POST", endpoint="/api/chat").time():
        try:
            response = assistant.get_response(request.message)
            return {"reply": response}
        except Exception as e:
            logger.error(f"Chat error: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/report-threat")
async def report_threat(threat: ThreatReport):
    """Report a detected threat to the blockchain"""
    REQUEST_COUNT.labels(method="POST", endpoint="/api/report-threat").inc()
    with REQUEST_DURATION.labels(method="POST", endpoint="/api/report-threat").time():
        try:
            tx_hash = contract_instance.functions.reportThreat(
                Web3.toChecksumAddress(web3.eth.accounts[0]),
                threat.threat_data,
                int(datetime.now().timestamp())
            ).transact()
            
            receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
            
            # Get threat ID from emitted event
            logs = contract_instance.events.ThreatReported().processReceipt(receipt)
            threat_id = logs[0]['args']['threatId'].hex() if logs else None
            
            return {
                "message": "Threat reported successfully",
                "threat_id": threat_id,
                "tx_hash": tx_hash.hex()
            }
        except Exception as e:
            logger.error(f"Threat reporting failed: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/verify-threat")
async def verify_threat(verification: ThreatVerification):
    """Verify a reported threat (admin only)"""
    REQUEST_COUNT.labels(method="POST", endpoint="/api/verify-threat").inc()
    with REQUEST_DURATION.labels(method="POST", endpoint="/api/verify-threat").time():
        try:
            tx_hash = contract_instance.functions.verifyThreat(
                bytes.fromhex(verification.threat_id)
            ).transact({'from': web3.eth.accounts[0]})
            
            web3.eth.wait_for_transaction_receipt(tx_hash)
            return {
                "message": "Threat verification updated",
                "threat_id": verification.threat_id,
                "verified": verification.verified,
                "tx_hash": tx_hash.hex()
            }
        except Exception as e:
            logger.error(f"Threat verification failed: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/threat/{threat_id}")
async def get_threat_info(threat_id: str):
    """Retrieve threat information from blockchain"""
    REQUEST_COUNT.labels(method="GET", endpoint="/api/threat/{threat_id}").inc()
    with REQUEST_DURATION.labels(method="GET", endpoint="/api/threat/{threat_id}").time():
        try:
            threat = contract_instance.functions.getThreatInfo(
                bytes.fromhex(threat_id)
            ).call()
            
            return {
                "threat_id": threat_id,
                "reporter": threat[0],
                "threat_data": threat[1],
                "timestamp": threat[2],
                "verified": threat[3]
            }
        except Exception as e:
            logger.error(f"Threat lookup failed: {str(e)}")
            raise HTTPException(status_code=404, detail="Threat not found")

@app.get("/api/threats/recent")
async def get_recent_threats(limit: int = 10):
    """Get recent threat reports"""
    REQUEST_COUNT.labels(method="GET", endpoint="/api/threats/recent").inc()
    with REQUEST_DURATION.labels(method="GET", endpoint="/api/threats/recent").time():
        try:
            # This would query your database or blockchain events
            # Implementation depends on your storage solution
            return {"message": "Recent threats endpoint", "limit": limit}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Service health check"""
    return {
        "status": "operational",
        "service": "BlockShield AI",
        "version": "1.0.0",
        "blockchain_connected": web3.isConnected()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)