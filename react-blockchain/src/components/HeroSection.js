import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import '../App.css';
import { Button } from './Button';
import './css/HeroSection.css';
import { 
  chatWithThreatAnalyst,
  analyzeURL,
  fetchThreatStats,
  verifyThreatOnBlockchain, 
  getBlockchainThreatDetails,
  checkBlockchainConnection
} from './services/api';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback cyber-card">
          <h2>SYSTEM FAILURE</h2>
          <p>{this.state.error.toString()}</p>
          <button 
            className="cyber-button"
            onClick={() => window.location.reload()}
          >
            REBOOT SYSTEM
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AnalysisPopup = ({ result, onClose, onVerify }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);

  const threatColor = {
    critical: '#ff3860',
    high: '#ff7b25',
    medium: '#ffdd57',
    low: '#2ecc71',
    none: '#00f0ff'
  };

  const handleVerifyClick = async () => {
    if (!result?.is_malicious) {
      setError("Only malicious threats can be verified");
      return;
    }

    if (result.verified) {
      setVerificationStatus("already_verified");
      return;
    }

    const threatId = result.blockchain_threat_id;
    if (!threatId) {
      setError("System error: Missing blockchain threat ID");
      return;
    }

    setIsVerifying(true);
    setError(null);
    setVerificationStatus("in_progress");

    try {
      await onVerify(threatId);
      setVerificationStatus("success");
      setTimeout(() => onClose(), 3000);
    } catch (err) {
      console.error("Verification error:", err);
      setVerificationStatus("failed");
      setError(err.message || "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const getButtonContent = () => {
    if (verificationStatus === "already_verified") {
      return (
        <>
          <i className="fas fa-check-circle"></i> VERIFIED
        </>
      );
    }
    if (isVerifying) {
      return (
        <>
          <i className="fas fa-spinner fa-spin"></i> VERIFYING...
        </>
      );
    }
    return "VERIFY THREAT";
  };

  const isButtonDisabled = !result?.is_malicious || 
                         result?.verified || 
                         isVerifying ||
                         verificationStatus === "already_verified";

  return (
    <div className="modal-overlay">
      <div className="cyber-modal">
        <div className="cyber-modal-header">
          <h3 className="cyber-text">THREAT ANALYSIS</h3>
          <button onClick={onClose} className="cyber-close">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="cyber-modal-body">
          <div className="scanline-animation"></div>
          
          <div className="result-grid">
            <div className="result-item">
              <span className="result-label">DOMAIN:</span>
              <span className="result-value">{result?.domain}</span>
            </div>
            
            <div className="result-item">
              <span className="result-label">IP:</span>
              <span className="result-value">{result?.ip}</span>
            </div>
            
            <div className="result-item">
              <span className="result-label">THREAT:</span>
              <span className="result-value" style={{
                color: threatColor[result?.threat_level?.toLowerCase()] || '#00f0ff',
                textShadow: `0 0 8px ${threatColor[result?.threat_level?.toLowerCase()] || '#00f0ff'}80`
              }}>
                {result?.threat_signature?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
            
            <div className="result-item">
              <span className="result-label">CONFIDENCE:</span>
              <span className="result-value">
                {result?.confidence ? Math.round(result.confidence * 100) : 0}%
              </span>
            </div>
            
            <div className="result-item full-width">
              <div className="threat-meter">
                <div 
                  className="threat-level" 
                  style={{
                    width: `${result?.confidence ? Math.round(result.confidence * 100) : 0}%`,
                    background: `linear-gradient(90deg, ${threatColor[result?.threat_level?.toLowerCase()] || '#00f0ff'}, #00f0ff)`
                  }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="modal-actions">
            <button 
              onClick={handleVerifyClick}
              className={`cyber-button ${verificationStatus === "success" ? "verified" : ""}`}
              disabled={isButtonDisabled}
              aria-busy={isVerifying}
            >
              {getButtonContent()}
            </button>
            
            {error && (
              <div className="error-message">
                <i className="fas fa-exclamation-triangle"></i> {error}
              </div>
            )}
            
            {verificationStatus === "success" && (
              <div className="success-message">
                <i className="fas fa-check-circle"></i> Threat verified successfully!
              </div>
            )}
          </div>
        </div>
        
        <div className="cyber-modal-footer">
          <span className="system-alert">
            <i className="fas fa-shield-alt"></i> BLOCKSHIELD AI PROTECTION ACTIVE
          </span>
        </div>
      </div>
    </div>
  );
};

const VerificationPopup = ({ result, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="cyber-modal">
        <div className="cyber-modal-header">
          <h3 className="cyber-text">THREAT VERIFICATION</h3>
          <button onClick={onClose} className="cyber-close">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="cyber-modal-body">
          <div className="scanline-animation"></div>
          
          <div className="verification-content">
            <div className="verification-icon success">
              <i className="fas fa-check-circle"></i>
            </div>
            <h4>THREAT VERIFIED ON BLOCKCHAIN</h4>
            <p>The threat has been permanently recorded and verified on the blockchain.</p>
            
            <div className="verification-details">
              <div className="detail-item">
                <span className="detail-label">Threat ID:</span>
                <span className="detail-value">{result?.threat_id}</span>
              </div>
              {result?.tx_hash && (
                <div className="detail-item">
                  <span className="detail-label">Transaction:</span>
                  <span className="detail-value">
                    {result.tx_hash.substring(0, 12)}...{result.tx_hash.substring(result.tx_hash.length - 4)}
                  </span>
                </div>
              )}
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className="detail-value verified">Verified</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="cyber-modal-footer">
          <span className="system-alert">
            <i className="fas fa-link"></i> BLOCKCHAIN TRANSACTION CONFIRMED
          </span>
        </div>
      </div>
    </div>
  );
};

function HeroSection() {
  const [showChat, setShowChat] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [account, setAccount] = useState('');
  const [networkId, setNetworkId] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [threatStats, setThreatStats] = useState({
    last24h: 0,
    verified: 0,
    topThreat: 'None'
  });
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showAnalysisPopup, setShowAnalysisPopup] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const [blockchainConnected, setBlockchainConnected] = useState(false);

  const initializeWeb3 = async () => {
    try {
      let web3Instance;
      
      // Modern dapp browsers
      if (window.ethereum) {
        web3Instance = new Web3(window.ethereum);
        
        // Check if already authorized
        if (window.ethereum.selectedAddress) {
          const accounts = await web3Instance.eth.getAccounts();
          setAccount(accounts[0]);
        } else {
          try {
            // Request account access
            const accounts = await window.ethereum.request({ 
              method: 'eth_requestAccounts' 
            });
            setAccount(accounts[0]);
          } catch (error) {
            if (error.code === 4001) {
              // User rejected request
              console.log('Please connect to MetaMask to continue');
            }
            console.error('MetaMask connection error:', error);
          }
        }
        
        // Refresh on account change
        window.ethereum.on('accountsChanged', (accounts) => {
          setAccount(accounts[0] || '');
        });
      } 
      // Legacy dapp browsers
      else if (window.web3) {
        web3Instance = new Web3(window.web3.currentProvider);
        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0]);
      }
      // Fallback to local provider
      else {
        console.log('No web3 instance detected, falling back to local provider');
        const localProvider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
        web3Instance = new Web3(localProvider);
        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0] || 'No account found');
      }
  
      setWeb3(web3Instance);
      
      // Get network ID
      const id = await web3Instance.eth.net.getId();
      setNetworkId(id);
  
      // Check backend connection
      const isConnected = await checkBlockchainConnection();
      setBlockchainConnected(isConnected);
  
      // Load initial stats
      const stats = await fetchThreatStats().catch(() => ({
        last24h: 0,
        verified: 0,
        topThreat: 'None'
      }));
      setThreatStats(stats);
      
    } catch (error) {
      console.error('Web3 initialization error:', error);
      setAccount('Error connecting to blockchain');
      setBlockchainConnected(false);
    }
  };
     // Add this useEffect to call initializeWeb3
  useEffect(() => {
    initializeWeb3();
  }, []);

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
  
    setIsLoading(true);
    setAnalysisResult(null);
    
    try {
      const result = await analyzeURL(urlInput);
  
      const generateThreatId = () => {
        // Simple timestamp-based ID
        return `threat_${Date.now()}`;
      };
  
      const threatId = result.threat_id || generateThreatId();
      
      const analysisResult = {
        domain: result.domain || new URL(urlInput).hostname,
        ip: result.ip_address || result.ip || 'N/A',
        port: result.port || (urlInput.startsWith('https') ? 443 : 80),
        path: result.path || '/',
        threat_signature: result.threat_signature || 'unknown',
        threat_level: result.threat_level || 'none',
        confidence: result.confidence || 0,
        is_malicious: result.is_malicious || false,
        threat_id: threatId,
        blockchain_threat_id: result.blockchain_threat_id || threatId,
        verified: result.verified || false,
        query_params: result.query_params || {},
        timestamp: result.timestamp || new Date().toISOString()
      };

      setAnalysisResult(analysisResult);
      setShowAnalysisPopup(true);
  
      setThreatStats(prev => ({
        ...prev,
        last24h: result.is_malicious ? prev.last24h + 1 : prev.last24h,
        topThreat: result.is_malicious ? result.threat_signature : prev.topThreat
      }));
  
    } catch (error) {
      console.error('URL analysis error:', error);
      
      let errorMessage = "URL analysis failed";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
        if (error.response.data.message) {
          errorMessage += `: ${error.response.data.message}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  const handleVerifyThreat = async (threatId) => {
    setIsLoading(true);
    try {
      // Validate threat ID
      if (!threatId) {
        throw new Error("Invalid threat identifier");
      }
  
      // Check if already verified
      const existingDetails = await getBlockchainThreatDetails(threatId);
      if (existingDetails?.verified) {
        setAnalysisResult(prev => ({ ...prev, verified: true }));
        throw new Error("This threat was already verified");
      }
  
      // Perform verification
      const result = await verifyThreatOnBlockchain(threatId);
      
      if (!result.verified) {
        throw new Error("Blockchain verification failed");
      }
  
      // Update state
      setVerificationResult({
        threat_id: threatId,
        status: 'verified',
        tx_hash: result.tx_hash,
        timestamp: new Date().toISOString()
      });
  
      setAnalysisResult(prev => ({
        ...prev,
        verified: true,
        verification_tx_hash: result.tx_hash
      }));
  
      setShowVerificationPopup(true);
      
      // Update stats
      setThreatStats(prev => ({
        ...prev,
        verified: prev.verified + 1
      }));
      
      return result;
    } catch (error) {
      console.error("Verification error:", error);
      
      let errorMsg = error.message || "Verification failed";
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowChat(!showChat);
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setIsLoading(true);
    const userMessage = { role: 'user', content: message };
    const updatedConversation = [...conversation, userMessage];
    setConversation(updatedConversation);
    setMessage('');
    
    try {
      const response = await chatWithThreatAnalyst({
        message: message,
        history: conversation
      });
      
      setConversation([...updatedConversation, {
        role: 'assistant',
        content: response.message.content
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = typeof error === 'string' ? error : 
                          error.response?.data?.detail || 
                          error.message || 
                          'Sorry, I encountered an error. Please try again.';
      setConversation([...updatedConversation, {
        role: 'assistant',
        content: errorMessage
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getNetworkName = () => {
    switch(networkId) {
      case 1: return 'Ethereum Mainnet';
      case 5: return 'Goerli Testnet';
      case 5777: return 'Local Development';
      default: return networkId ? `Network ID: ${networkId}` : 'Disconnected';
    }
  };

  return (
    <div className='hero-container'>
      <video src='/videos/video-2.mp4' autoPlay loop muted />
      
      <div className="cyber-header">
        <h1 className="cyber-title glitch-layers" data-text="BlockShield.AI">
          <span>BlockShield.AI</span>
        </h1>
        <p className="cyber-subtitle">
          <span className="cyber-word">AI-POWERED</span>
          <span className="cyber-divider">∎</span>
          <span className="cyber-word">THREAT</span>
          <span className="cyber-divider">∎</span>
          <span className="cyber-word">INTELLIGENCE</span>
        </p>
      </div>
      
      <div className="threat-stats-grid">
        <div className="stat-card">
          <h3>THREATS (24H)</h3>
          <p className="stat-value">{threatStats.last24h}</p>
        </div>
        <div className="stat-card">
          <h3>VERIFIED</h3>
          <p className="stat-value">{threatStats.verified}</p>
        </div>
        <div className="stat-card">
          <h3>TOP THREAT</h3>
          <p className="stat-value">{threatStats.topThreat}</p>
        </div>
      </div>
      
      <div className="url-analysis-section">
        <form onSubmit={handleUrlSubmit}>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter URL to analyze"
            className="cyber-input"
            required
          />
          
          <div className="url-action-buttons">
            <Button
              className='btns'
              buttonStyle='btn--outline'
              buttonSize='btn--large'
              onClick={handleUrlSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> ANALYZING...
                </>
              ) : (
                'Defend with AI — Scan Now'
              )}
            </Button>
            
            <Button
              className='btns'
              buttonStyle='btn--primary'
              buttonSize='btn--large'
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (analysisResult?.blockchain_threat_id) {
                  handleVerifyThreat(analysisResult.blockchain_threat_id)
                    .catch(() => {}); // Silence unhandled promise rejection
                } else {
                  alert("Please analyze a URL first");
                }
              }}
              disabled={
                !analysisResult?.is_malicious || 
                analysisResult?.verified ||
                isLoading ||
                !blockchainConnected
              }
            >
              {isLoading ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : !blockchainConnected ? (
                'BLOCKCHAIN OFFLINE'
              ) : analysisResult?.verified ? (
                'VERIFIED'
              ) : (
                <>
                  VERIFY THREAT <i className='fas fa-search' />
                </>
              )}
            </Button>


            <Button
              className='btns'
              buttonStyle='btn--outline'
              buttonSize='btn--large'
              onClick={handleChatToggle}
            >
              {showChat ? 'HIDE ANALYST' : 'THREAT AI ANALYST'}
            </Button>
          </div>
        </form>
      </div>

      {showAnalysisPopup && (
        <AnalysisPopup 
          result={analysisResult} 
          onClose={() => setShowAnalysisPopup(false)}
          onVerify={handleVerifyThreat}
        />
      )}

      {showVerificationPopup && (
        <VerificationPopup 
          result={verificationResult}
          onClose={() => setShowVerificationPopup(false)}
        />
      )}

      {showChat && (
        <div className="chat-container cyber-card">
          <div className="chat-messages">
            {conversation.length === 0 && (
              <div className="message assistant welcome-message">
                <strong>THREAT ANALYST:</strong><strong>Welcome to BlockShield AI Threat Intelligence. Ask me about anything!</strong>
              </div>
            )}
            
            {conversation.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                <strong>{msg.role === 'user' ? 'YOU:' : 'ANALYST:'}</strong> {msg.content}
              </div>
            ))}
            
            {isLoading && (
              <div className="message assistant">
                <strong>ANALYST:</strong> 
                <span className="typing-indicator">
                  <span>.</span><span>.</span><span>.</span>
                </span>
              </div>
            )}
          </div>
          
          <form onSubmit={handleChatSubmit} className="chat-input">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="ASK ABOUT THREAT INTELLIGENCE..."
              disabled={isLoading}
              className="cyber-input"
            />
            <button 
              type="submit" 
              disabled={isLoading || !message.trim()}
              className="cyber-button"
            >
              {isLoading ? <i className="fas fa-spinner fa-spin"></i> : 'SEND'}
            </button>
          </form>
        </div>
      )}

      <div className='system-indicators'>
        <span><i className='fas fa-network-wired'></i> {getNetworkName()}</span>
        <span><i className='fas fa-user-shield'></i> {account && !account.includes('Error') ? 'Authenticated' : 'Unauthenticated'}</span>
        <span><i className='fas fa-bell'></i> {threatStats.last24h} threats today</span>
        <span><i className='fas fa-link'></i> {blockchainConnected ? 'Blockchain Connected' : 'Blockchain Offline'}</span>
      </div>
    </div>
  );
}

export default function WrappedHeroSection() {
  return (
    <ErrorBoundary>
      <HeroSection />
    </ErrorBoundary>
  );
}