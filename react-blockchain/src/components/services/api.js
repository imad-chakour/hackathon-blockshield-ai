import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

// Fetch system status
export const fetchSystemStatus = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/health`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: "Failed to fetch system status" };
    }
};

// Report a threat
export const reportThreat = async (threatData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/report-threat`, {
            threat_data: threatData.threatData,
            threat_type: threatData.threatType,
            confidence: threatData.confidence,
            source_ip: threatData.sourceIp
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: "Threat reporting failed" };
    }
};

// Verify a threat
export const verifyThreat = async (threatId) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/verify-threat`, {
            threat_id: threatId
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: "Threat verification failed" };
    }
};

// Get threat details
export const getThreatDetails = async (threatId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/threat/${threatId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: "Failed to fetch threat details" };
    }
};

// Get recent threats
export const getRecentThreats = async (limit = 10) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/threats/recent`, {
            params: { limit }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: "Failed to fetch recent threats" };
    }
};

// Chat with Threat Analyst
export const chatWithThreatAnalyst = async ({ message }) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/assistant`, {
            message
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: "Failed to communicate with threat analyst" };
    }
};