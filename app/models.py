# app/model.py
from pydantic import BaseModel, Field
from typing import Any, List, Dict, Optional

class ThreatVerification(BaseModel):
    threat_id: str

class ThreatVerificationRequest(BaseModel):
    threat_id: str
   
class URLAnalysisRequest(BaseModel):
    url: str

class URLAnalysisResponse(BaseModel):
    domain: str
    ip_address: Optional[str]
    threat_signature: str
    threat_level: str
    confidence: float
    is_malicious: bool
    threat_id: str
    blockchain_threat_id: Optional[str]
    verified: bool
    verification_tx_hash: Optional[str]
    timestamp: str

class ChatMessage(BaseModel):
    role: str 
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    api_key: str
    temperature: float = 0.7
    max_tokens: int = 2048
    model: str = "gemini-1.5-flash"

class ChatResponse(BaseModel):
    message: ChatMessage
    status_code: int
    success: bool
    raw_response: Optional[Dict] = None

class ThreatReport(BaseModel):
    """Model representing a threat report from blockchain"""
    reporter: str
    url: str
    threat_signature: str
    threat_level: int
    confidence: float  # 0.0-1.0
    timestamp: int
    is_malicious: bool
    verified: bool
    threat_id: Optional[str] = None
