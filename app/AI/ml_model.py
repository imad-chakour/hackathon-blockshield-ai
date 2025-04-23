from pathlib import Path
from fastapi import logger
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from typing import Dict, Any
import logging
import numpy as np

class ThreatDetector:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.model_name = "scikit-learn URL classifier"
        self.license = "MIT" 
        self.creators = "Imad & Omar BlockSheild.AI Organization"
        self._initialize_model()

    # Update _initialize_model() to handle missing files
    def _initialize_model(self):
        model_paths = {
            'model': "./url_model.pkl",
            'vectorizer': "./tfidf_vectorizer.pkl",
            'encoder': "./label_encoder.pkl"
        }
        
        missing = [name for name, path in model_paths.items() if not Path(path).exists()]
        if missing:
            raise FileNotFoundError(f"Missing model files: {', '.join(missing)}")
        
        try:
            self.model = joblib.load(model_paths['model'])
            self.vectorizer = joblib.load(model_paths['vectorizer'])
            self.label_encoder = joblib.load(model_paths['encoder'])
        except Exception as e:
            logger.error(f"Model loading error: {str(e)}")
            raise

    def analyze_url(self, url: str) -> Dict[str, Any]:
        """
        Analyze a URL for threats using the scikit-learn model
        """
        try:
            # Vectorize the URL
            vectorized_url = self.vectorizer.transform([url])
            
            # Get prediction and probabilities
            prediction = self.model.predict(vectorized_url)
            probabilities = self.model.predict_proba(vectorized_url)[0]
            
            # Decode the label
            label = self.label_encoder.inverse_transform(prediction)[0]
            
            return {
                **self._get_threat_details(label, probabilities),
                "model_info": {
                    "name": self.model_name,
                    "license": self.license,
                    "creators": self.creators
                }
            }
            
        except Exception as e:
            self.logger.error(f"URL analysis failed: {str(e)}")
            return {
                "threat_signature": "error",
                "threat_level": "error",
                "confidence": 0.0,
                "error": str(e),
                "model_info": {
                    "name": self.model_name,
                    "license": self.license
                }
            }

    def _get_threat_details(self, label: str, probabilities: np.ndarray) -> Dict[str, Any]:
        """Map prediction to threat details"""
        threat_map = {
            "benign": {"threat_signature": "benign", "threat_level": "none", "confidence": 1.0},
            "defacement": {"threat_signature": "defacement", "threat_level": "medium", "confidence": 0.85},
            "phishing": {"threat_signature": "phishing", "threat_level": "high", "confidence": 0.95},
            "malware": {"threat_signature": "malware", "threat_level": "critical", "confidence": 0.90}
        }
        
        # Get the probability for the predicted class
        predicted_class_idx = self.label_encoder.transform([label])[0]
        confidence = probabilities[predicted_class_idx]
        
        return {
            **threat_map.get(label.lower(), threat_map["benign"]),
            "confidence": float(confidence),  # Convert numpy float to Python float
            "probabilities": probabilities.tolist(),
            "raw_prediction": label
        }