import logging
from typing import Dict

logger = logging.getLogger(__name__)

class ThreatIntelligenceAssistant:
    def __init__(self):
        self.responses = {
            "greeting": "Hello! I'm your BlockShield Threat Intelligence Assistant. How can I help you today?",
            "report": "To report a threat, POST to /api/report-threat with threat details. Required fields: threat_data, source_ip (optional), threat_type (optional), confidence_score (optional)",
            "verify": "To verify a threat, POST to /api/verify-threat with threat_id and verification status",
            "query": "To query threat info: GET /api/threat/{threat_id} or GET /api/threats/recent for latest threats",
            "help": "I can help with:\n- Threat reporting (/api/report-threat)\n- Threat verification (/api/verify-threat)\n- Threat intelligence queries (/api/threat)",
            "analytics": "Current threat stats:\n- Last 24h: 42 new threats\n- Verification rate: 78%\n- Top threat type: DDoS (32%)",
            "default": "I specialize in cybersecurity threat intelligence. Ask me about reporting, verifying, or querying threats."
        }
        
        # Threat type explanations
        self.threat_explanations = {
            "ddos": "Distributed Denial of Service attacks overwhelm systems with traffic.",
            "phishing": "Fraudulent attempts to obtain sensitive information by disguising as trustworthy entities.",
            "malware": "Malicious software designed to harm or exploit systems.",
            "ransomware": "Malware that encrypts files and demands payment for decryption.",
            "zero-day": "Exploits targeting previously unknown vulnerabilities."
        }
    
    def get_response(self, message: str) -> str:
        """Enhanced threat intelligence response system"""
        message = message.lower().strip()
        
        # Greeting detection
        if any(word in message for word in ["hello", "hi", "hey", "greetings"]):
            return self.responses["greeting"]
        
        # Threat reporting
        elif any(word in message for word in ["report", "submit", "new threat"]):
            return self.responses["report"]
        
        # Verification
        elif any(word in message for word in ["verify", "confirm", "validate threat"]):
            return self.responses["verify"]
        
        # Querying
        elif any(word in message for word in ["query", "check", "lookup", "find threat"]):
            return self.responses["query"]
        
        # Analytics
        elif any(word in message for word in ["stats", "analytics", "metrics", "dashboard"]):
            return self.responses["analytics"]
        
        # Help
        elif any(word in message for word in ["help", "support", "guide"]):
            return self.responses["help"]
        
        # Threat type explanations
        elif any(threat_type in message for threat_type in self.threat_explanations.keys()):
            for threat_type, explanation in self.threat_explanations.items():
                if threat_type in message:
                    return f"{threat_type.upper()} Explanation:\n{explanation}"
        
        # Default response
        return self.responses["default"]

    def get_threat_stats(self) -> Dict[str, int]:
        """Returns current threat statistics (mock data - would connect to DB in production)"""
        return {
            "last_24h": 42,
            "verified_threats": 78,
            "top_threat_type": "DDoS",
            "false_positives": 5,
            "active_investigations": 12
        }