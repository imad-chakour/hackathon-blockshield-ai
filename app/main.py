import hashlib
import time
import joblib
import socket
import logging
from app.models import *
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from urllib.parse import urlparse
from pathlib import Path
from app.blockchain import blockchain_service
from app.metrics import setup_metrics, REQUEST_COUNT, REQUEST_DURATION
from app.AI.gemini_service import GeminiService
from app.blockchain import blockchain_service, is_blockchain_connected


app = FastAPI(
    title="BlockShield AI API",
    description="API for AI-powered threat detection with blockchain verification",
    version="1.0.0"
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:3001",
    "http://localhost:9090"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


web3 = blockchain_service.w3
contract_instance = blockchain_service.contract
gemini_service = GeminiService()

metrics = setup_metrics(app)
REQUEST_COUNT = metrics["request_count"]
REQUEST_DURATION = metrics["request_duration"]

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent

MODEL_PATH = BASE_DIR / "AI" / "url_model.pkl"
VECTORIZER_PATH = BASE_DIR / "AI" / "tfidf_vectorizer.pkl"
LABEL_ENCODER_PATH = BASE_DIR / "AI" / "label_encoder.pkl"

ML_MODEL_INFO = {
    "name": "Joblib URL Classifier",
    "license": "Your License",
    "creators": "Imad & Omar Blocksheild.AI Organization",
    "purpose": "URL classification"
}

try:
    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
    label_encoder = joblib.load(LABEL_ENCODER_PATH)
    logger.info("Models loaded successfully")
except Exception as e:
    logger.error(f"Failed to load models: {str(e)}")
    raise RuntimeError("Model initialization failed")

@app.get("/health")
async def health_check():
    """Service health check"""
    return {
        "status": "operational" if is_blockchain_connected() else "degraded",
        "service": "BlockShield AI",
        "version": "1.0.0",
        "blockchain_connected": is_blockchain_connected(),
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/blockchain/status")
async def blockchain_status():
    """Detailed blockchain status"""
    return {
        **blockchain_service.get_service_status(),
        "peers": len(blockchain_service.w3.geth.admin.peers()) if hasattr(blockchain_service.w3, 'geth') else 0,
        "syncing": blockchain_service.w3.eth.syncing if blockchain_service.is_connected() else False
    }

@app.post("/api/analyze-url", response_model=URLAnalysisResponse)
async def analyze_url(request: URLAnalysisRequest):
    """Analyze URL using joblib model and report to blockchain if malicious"""
    REQUEST_COUNT.labels(method="POST", endpoint="/api/analyze-url").inc()
    
    with REQUEST_DURATION.labels(method="POST", endpoint="/api/analyze-url").time():
        try:
            # Validate and parse URL
            parsed = urlparse(request.url)
            if not all([parsed.scheme, parsed.netloc]):
                raise ValueError("Invalid URL format")
            
            # Get IP info
            ip_address = None
            try:
                ip_address = socket.gethostbyname(parsed.hostname)
            except socket.gaierror:
                pass
            
            # Vectorize and predict
            input_vector = vectorizer.transform([request.url])
            prediction_idx = model.predict(input_vector)[0]
            prediction = label_encoder.inverse_transform([prediction_idx])[0]
            probabilities = model.predict_proba(input_vector)[0]
            
            threat_map = {
                "benign": {
                    "threat_signature": "benign",
                    "threat_level": "none",
                    "confidence": float(probabilities[prediction_idx])  # Actual confidence
                },
                "defacement": {
                    "threat_signature": "defacement",
                    "threat_level": "medium",
                    "confidence": float(probabilities[prediction_idx])
                },
                "phishing": {
                    "threat_signature": "phishing",
                    "threat_level": "high",
                    "confidence": float(probabilities[prediction_idx])
                },
                "malware": {
                    "threat_signature": "malware",
                    "threat_level": "critical",
                    "confidence": float(probabilities[prediction_idx])
                }
            }
            
            ml_result = {
                **threat_map.get(prediction.lower(), threat_map["benign"]),
                "model_info": ML_MODEL_INFO,
                "probabilities": probabilities.tolist(),
                "raw_prediction": prediction
            }
            
            # Generate consistent threat ID
            timestamp = int(time.time())
            url_hash = hashlib.sha256(request.url.encode()).hexdigest()[:8]
            threat_id = f"threat_{timestamp}_{url_hash}"
            
            # Extract query parameters
            query_params = {}
            if parsed.query:
                query_params = dict(param.split('=') for param in parsed.query.split('&') if '=' in param)
            
            # Initialize blockchain data with defaults
            blockchain_data = {
                "blockchain_threat_id": threat_id,
                "verified": False,
                "blockchain_status": "not_reported",
                "verification_tx_hash": None
            }
            
            if ml_result["threat_signature"] != "benign":
                try:
                    # Report to blockchain using the same threat_id
                    report_result = blockchain_service.report_threat(
                        threat_id=threat_id,
                        url=request.url,
                        threat_data={  
                            "threat_signature": ml_result["threat_signature"],
                            "threat_level": ml_result["threat_level"],
                            "confidence": ml_result["confidence"],
                            "is_malicious": True
                        }
                    )
                    
                    if report_result.get("success", False):
                        blockchain_data.update({
                            "blockchain_status": "reported",
                            "verification_tx_hash": report_result.get("tx_hash")
                        })
                        
                        # Attempt verification if needed
                        if request.auto_verify:
                            try:
                                verify_result = blockchain_service.verify_threat(threat_id)
                                if verify_result.get("success", False):
                                    blockchain_data.update({
                                        "verified": True,
                                        "blockchain_status": "verified",
                                        "verification_tx_hash": verify_result["tx_hash"]
                                    })
                            except Exception as verify_error:
                                logger.warning(f"Verification attempt failed: {str(verify_error)}")
                                blockchain_data["blockchain_status"] = "verification_failed"
                    
                except Exception as report_error:
                    logger.error(f"Blockchain report failed: {str(report_error)}")
                    blockchain_data.update({
                        "blockchain_status": "report_failed",
                        "error": str(report_error)
                    })
            
            return {
                "domain": parsed.hostname,
                "ip_address": ip_address,
                "port": parsed.port or (443 if parsed.scheme == "https" else 80),
                "path": parsed.path,
                "query_params": query_params,
                "is_malicious": ml_result["threat_signature"] != "benign",
                "threat_signature": ml_result["threat_signature"],
                "threat_level": ml_result["threat_level"],
                "confidence": ml_result["confidence"],
                "model_metadata": {
                    **ml_result["model_info"],
                    "probabilities": ml_result.get("probabilities", []),
                    "raw_prediction": ml_result.get("raw_prediction")
                },
                "threat_id": threat_id,
                **blockchain_data,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"URL analysis failed: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Analysis failed",
                    "message": str(e),
                    "url": request.url
                }
            )
#===================================================================================================
@app.post("/api/assistant")
async def assistant_endpoint(request: ChatRequest):
    """Endpoint for the threat analyst assistant"""
    REQUEST_COUNT.labels(method="POST", endpoint="/api/assistant").inc()
    with REQUEST_DURATION.labels(method="POST", endpoint="/api/assistant").time():
        response = await gemini_service.get_chat_response(
            messages=request.messages,
            api_key=request.api_key,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        if not response.success:
            raise HTTPException(
                status_code=response.status_code,
                detail=response.message.content
            )
            
        return response
#===================================================================================================
@app.get("/api/threat-stats")
async def get_threat_stats():
    """Get threat statistics"""
    REQUEST_COUNT.labels(method="GET", endpoint="/api/threat-stats").inc()
    with REQUEST_DURATION.labels(method="GET", endpoint="/api/threat-stats").time():
        try:
            # This would query your database/blockchain for real stats
            # For now, returning mock data
            return {
                "last24h": 0,
                "verified": 0,
                "topThreat": "None"
            }
        except Exception as e:
            logger.error(f"Failed to get threat stats: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve threat statistics"
            )

@app.post("/api/blockchain/verify/{threat_id}")
async def verify_threat(threat_id: str):
    """Verify a threat on the blockchain"""
    try:
        # Validate threat ID format
        if not threat_id or not threat_id.startswith("threat_"):
            raise ValueError("Invalid threat ID format")
            
        result = blockchain_service.verify_threat(threat_id)
        
        if not result.get("success", False):
            raise ValueError(result.get("message", "Verification failed"))
            
        return {
            "success": True,
            "threat_id": threat_id,  # Return original ID
            "tx_hash": result.get("tx_hash"),
            "verified": True,
            "message": "Verification successful"
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail={"error": "validation_error", "message": str(e)})
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "verification_error",
                "message": str(e),
                "threat_id": threat_id
            }
        )

#===================================================================================================
@app.get("/api/blockchain/threat/{threat_id}")
async def get_threat(threat_id: str):
    """Get threat details from blockchain"""
    try:
        if not threat_id or not threat_id.startswith("threat_"):
            raise ValueError("Invalid threat ID format")
            
        threat_info = blockchain_service.get_threat_info(threat_id)
        
        if not threat_info:
            raise ValueError("Threat not found")
            
        return {
            "success": True,
            "threat_id": threat_id,  # Return original ID
            "details": {
                "url": threat_info.url,
                "signature": threat_info.threat_signature,
                "level": threat_info.threat_level,
                "confidence": threat_info.confidence,
                "timestamp": threat_info.timestamp,
                "verified": threat_info.verified,
                "reporter": threat_info.reporter
            }
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail={"error": "invalid_request", "message": str(e)})
    except Exception as e:
        raise HTTPException(status_code=404, detail={"error": "not_found", "message": str(e)})

#===================================================================================================
@app.post("/api/blockchain/report")
async def report_threat(report: ThreatReport):
    """Report a threat to the blockchain"""
    try:
        # Generate or use provided threat ID
        threat_id = report.threat_id or f"threat_{int(time.time())}_{hashlib.sha256(report.url.encode()).hexdigest()[:8]}"
        
        result = blockchain_service.report_threat(
            threat_id=threat_id,
            url=report.url,
            threat_signature=report.threat_signature,
            threat_level=report.threat_level,
            confidence=report.confidence,
            is_malicious=report.is_malicious
        )
        
        return {
            "success": result.get("success", False),
            "threat_id": threat_id,  # Return consistent ID
            "tx_hash": result.get("tx_hash"),
            "message": result.get("message", "Report submitted")
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "report_failed",
                "message": str(e),
                "url": report.url
            }
        )

# ... (other endpoints remain the same)
#===================================================================================================
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.1", port=8001)