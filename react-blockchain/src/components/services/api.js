import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8001";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    "Content-Type": "application/json"
  },
  withCredentials: true // Important for cookie-based auth or CORS
});

// Track the last successful response time
let lastSuccessfulConnection = Date.now();
const CONNECTION_TIMEOUT = 30000; // 30 seconds

// Request interceptor
api.interceptors.request.use(config => {
  const now = Date.now();
  if (now - lastSuccessfulConnection > CONNECTION_TIMEOUT) {
    return Promise.reject({
      error: "connection_unstable",
      message: "No recent successful connections",
      config
    });
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  response => {
    lastSuccessfulConnection = Date.now(); // Update on success
    return response;
  },
  async error => {
    // Network error or server unreachable
    if (!error.response) {
      const errorInfo = {
        error: "connection_failed",
        message: "Cannot connect to backend service",
        details: `
          Failed to reach: ${API_BASE_URL}
          Possible solutions:
          1. Ensure backend is running (uvicorn app.main:app --reload --host 0.0.0.0 --port 8000)
          2. Verify no other service is using port 8000
          3. Check firewall settings
          4. Try accessing ${API_BASE_URL}/health in your browser
        `,
        config: error.config,
        isConnectionError: true
      };

      console.error("API Connection Error:", errorInfo);

      // Retry once
      error.config.__retryCount = error.config.__retryCount || 0;
      if (error.config.__retryCount >= 1) {
        return Promise.reject(errorInfo);
      }

      error.config.__retryCount += 1;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      return api.request(error.config);
    }

    // Propagate server-side errors
    return Promise.reject(error);
  }
);

// Health check utility
export const checkBlockchainConnection = async () => {
  try {
    const response = await api.get("/health"); // relative to baseURL
    return {
      ...response.data,
      connected: response.data.blockchain_connected,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: "unavailable",
      service: "BlockShield AI",
      connected: false,
      error: error?.error || "health_check_failed",
      message: error?.message || "Service unavailable",
      details: error?.details || `Could not reach ${API_BASE_URL}`
    };
  }
};

export default api;

// ======================================================================
// Threat Statistics
// ======================================================================
export const fetchThreatStats = async () => {
  try {
    const response = await api.get("/api/threat-stats");
    return response.data;
  } catch (error) {
    return {
      last24h: 0,
      verified: 0,
      topThreat: "None"
    };
  }
};

export const checkBlockchainStatus = async () => {
  try {
    const response = await api.get("/blockchain/status");
    return {
      ...response.data,
      connected: response.data.connected,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      connected: false,
      error: error.error || "blockchain_status_failed",
      message: error.message || "Failed to get blockchain status"
    };
  }
};


// ======================================================================
// URL Analysis
// ======================================================================
export const analyzeURL = async (url) => {
  try {
    const response = await api.post("/api/analyze-url", { url });
    
    const result = response.data;
    if (result.is_malicious && !result.blockchain_threat_id) {
      result.blockchain_threat_id = `threat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    
    return {
      domain: result.domain,
      ip: result.ip_address || result.ip || 'N/A',
      threat_signature: result.threat_signature || 'unknown',
      threat_level: result.threat_level || 'none',
      confidence: result.confidence || 0,
      is_malicious: result.is_malicious || false,
      threat_id: result.threat_id,
      blockchain_threat_id: result.blockchain_threat_id,
      verified: result.verified || false,
      verification_tx_hash: result.verification_tx_hash || null,
      timestamp: result.timestamp || new Date().toISOString()
    };
  } catch (error) {
    throw error.response?.data || { 
      error: "URL analysis failed",
      details: error.message 
    };
  }
};


// ======================================================================
// Recent Threats
// ======================================================================
export const getRecentThreats = async (limit = 10) => {
  try {
    const response = await api.get("/api/threats/recent", {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to fetch recent threats" };
  }
};

// ======================================================================
// Threat Analyst Chat
// ======================================================================
export const chatWithThreatAnalyst = async ({ message, history = [] }) => {
  try {
    const messages = history.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      content: msg.content
    }));
    
    messages.push({
      role: "user",
      content: message
    });

    const response = await api.post("/api/assistant", { 
      messages,
      api_key: process.env.REACT_APP_GEMINI_API_KEY,
      temperature: 0.7,
      max_tokens: 2048
    });

    return response.data;
  } catch (error) {
    throw error.response?.data || { 
      error: error.message || "Failed to get response from analyst" 
    };
  }
};
// ======================================================================
// Blockchain Threat Operations
// ======================================================================
// services/api.js
export const verifyThreatOnBlockchain = async (threatId) => {
  try {
    if (!threatId || !threatId.startsWith("threat_")) {
      throw new Error("Invalid threat ID format");
    }

    const response = await api.post(`/api/blockchain/verify/${threatId}`);
    
    return {
      verified: response.data.verified,
      tx_hash: response.data.tx_hash,
      threat_id: threatId,
      message: response.data.message
    };
  } catch (error) {
    console.error(`Verification failed for ${threatId}:`, error);
    
  }
};

export const reportThreatToBlockchain = async (threatData) => {
  try {
    const response = await api.post("/api/blockchain/report", threatData);
    return {
      threat_id: response.data.threat_id,
      tx_hash: response.data.tx_hash
    };
  } catch (error) {
    throw error.response?.data || { 
      error: "Failed to report threat to blockchain",
      details: error.message 
    };
  }
};

export const getBlockchainThreatDetails = async (threatId) => {
  try {
    if (!threatId || !threatId.startsWith("threat_")) {
      throw new Error("Invalid threat ID format");
    }

    const response = await api.get(`/api/blockchain/threat/${threatId}`);
    
    return {
      reporter: response.data.reporter,
      url: response.data.url,
      threat_signature: response.data.threat_signature,
      threat_level: response.data.threat_level,
      confidence: response.data.confidence,
      timestamp: response.data.timestamp,
      is_malicious: response.data.is_malicious,
      verified: response.data.verified,
      threat_id: threatId
    };
  } catch (error) {
    console.error(`Failed to fetch threat ${threatId}:`, error);
    throw error.response?.data || { 
      error: "Failed to get threat from blockchain",
      details: error.message 
    };
  }
};

// ======================================================================
// Combined Threat Operations
// ======================================================================

export const fetchDashboardData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

export const verifyThreat = async (threatId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/verify-threat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ threat_id: threatId }),
    });
    if (!response.ok) {
      throw new Error('Verification failed');
    }
    return await response.json();
  } catch (error) {
    console.error('Error verifying threat:', error);
    throw error;
  }
};