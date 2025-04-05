import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import '../App.css';
import { Button } from './Button';
import './css/HeroSection.css';
import { 
  chatWithThreatAnalyst,
  reportThreat,
  verifyThreat,
  getThreatDetails
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

function HeroSection() {
  const [showChat, setShowChat] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threatData, setThreatData] = useState({
    threatId: '',
    threatType: 'malware',
    confidence: 80,
    description: ''
  });
  const [verificationResult, setVerificationResult] = useState(null);
  const [account, setAccount] = useState('');
  const [networkId, setNetworkId] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [threatStats, setThreatStats] = useState({
    last24h: 0,
    verified: 0,
    topThreat: 'None'
  });

  useEffect(() => {
    const initializeWeb3 = async () => {
      try {
        let web3Instance;
        if (window.ethereum) {
          web3Instance = new Web3(window.ethereum);
          try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
          } catch (error) {
            console.error("User denied account access");
          }
        } else if (window.web3) {
          web3Instance = new Web3(window.web3.currentProvider);
        } else {
          console.log('No injected web3 provider detected. Using local provider.');
          const localProvider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
          web3Instance = new Web3(localProvider);
        }

        setWeb3(web3Instance);
        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0] || 'No account found');
        
        const id = await web3Instance.eth.net.getId();
        setNetworkId(id);

        // Load initial threat stats
        const stats = {
          last24h: 42,
          verified: 32,
          topThreat: 'DDoS'
        };
        setThreatStats(stats);
      } catch (error) {
        console.error('Web3 initialization error:', error);
        setAccount('Error connecting to blockchain');
      }
    };

    initializeWeb3();
  }, []);

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
        message: message
      });
      setConversation([...updatedConversation, {
        role: 'assistant',
        content: response.reply
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error.response?.data?.detail || 
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setThreatData(prev => ({ ...prev, [name]: value }));
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const tx = await reportThreat({
        threat_data: threatData.description,
        threat_type: threatData.threatType,
        confidence: threatData.confidence,
        source_ip: "N/A"
      });
      
      alert(`Threat successfully reported!\nThreat ID: ${tx.threat_id}\nTransaction hash: ${tx.tx_hash}`);
      setShowReportModal(false);
      setThreatData({ 
        threatId: '', 
        threatType: 'malware', 
        confidence: 80, 
        description: '' 
      });
      
      // Update stats
      setThreatStats(prev => ({
        ...prev,
        last24h: prev.last24h + 1
      }));
    } catch (error) {
      alert(`Error: ${error.response?.data?.error || error.message || 'Threat reporting failed'}`);
      console.error('Report error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await verifyThreat(threatData.threatId);
      setVerificationResult(result);
      
      // Update stats if verification was successful
      if (result.verified) {
        setThreatStats(prev => ({
          ...prev,
          verified: prev.verified + 1
        }));
      }
    } catch (error) {
      setVerificationResult({ 
        message: error.response?.data?.error || error.message || 'Threat verification failed',
        data: null 
      });
      console.error('Verify error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getNetworkName = () => {
    switch(networkId) {
      case 1: return 'Ethereum Mainnet';
      case 5: return 'Goerli Testnet';
      case 1337: return 'Local Development';
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
      
      <div className='hero-btns'>
        <Button
          className='btns'
          buttonStyle='btn--outline'
          buttonSize='btn--large'
          onClick={() => setShowReportModal(true)}
          disabled={!account || account.includes('Error')}
        >
          REPORT THREAT
        </Button>
        <Button
          className='btns'
          buttonStyle='btn--primary'
          buttonSize='btn--large'
          onClick={() => setShowVerifyModal(true)}
        >
          VERIFY THREAT <i className='fas fa-search' />
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

      {/* Report Threat Modal */}
      {showReportModal && (
        <div className="modal-overlay">
          <div className="modal-content cyber-card">
            <h2 className="cyber-text">REPORT NEW THREAT</h2>
            <p className="account-info">
              <i className="fas fa-shield-alt"></i> Reporting as: {account && account.length > 10 ? 
                `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : 
                account}
            </p>
            <form onSubmit={handleReportSubmit}>
              <select
                name="threatType"
                value={threatData.threatType}
                onChange={handleInputChange}
                className="cyber-input"
                required
              >
                <option value="malware">Malware</option>
                <option value="phishing">Phishing</option>
                <option value="ddos">DDoS</option>
                <option value="ransomware">Ransomware</option>
                <option value="insider">Insider Threat</option>
                <option value="zero-day">Zero-Day</option>
              </select>
              
              <div className="confidence-slider">
                <label>CONFIDENCE LEVEL: {threatData.confidence}%</label>
                <input
                  type="range"
                  name="confidence"
                  min="0"
                  max="100"
                  value={threatData.confidence}
                  onChange={handleInputChange}
                />
              </div>
              
              <textarea
                name="description"
                value={threatData.description}
                onChange={handleInputChange}
                placeholder="THREAT DETAILS (IOCS, BEHAVIOR, ETC.)"
                className="cyber-input"
                rows="4"
                required
              />
              
              <div className="modal-actions">
                <Button 
                  type="submit" 
                  buttonStyle='btn--primary'
                  disabled={isLoading}
                >
                  {isLoading ? 'SUBMITTING...' : 'REPORT THREAT'}
                </Button>
                <Button 
                  buttonStyle='btn--outline' 
                  onClick={() => setShowReportModal(false)}
                  disabled={isLoading}
                >
                  CANCEL
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify Threat Modal */}
      {showVerifyModal && (
        <div className="modal-overlay">
          <div className="modal-content cyber-card">
            <h2 className="cyber-text">VERIFY THREAT</h2>
            <form onSubmit={handleVerifySubmit}>
              <input
                name="threatId"
                value={threatData.threatId}
                onChange={handleInputChange}
                placeholder="ENTER THREAT ID"
                className="cyber-input"
                required
              />
              <div className="modal-actions">
                <Button 
                  type="submit" 
                  buttonStyle='btn--primary'
                  disabled={isLoading}
                >
                  {isLoading ? 'ANALYZING...' : 'VERIFY'}
                </Button>
                <Button 
                  buttonStyle='btn--outline' 
                  onClick={() => {
                    setShowVerifyModal(false);
                    setVerificationResult(null);
                  }}
                  disabled={isLoading}
                >
                  CANCEL
                </Button>
              </div>
            </form>

            {verificationResult && (
              <div className={`verification-result ${verificationResult.data ? 'success' : 'error'}`}>
                <h3 className="cyber-text-small">
                  {verificationResult.data ? '✓ THREAT VERIFIED' : '✗ THREAT NOT FOUND'}
                </h3>
                <p>{verificationResult.message}</p>
                {verificationResult.data && (
                  <div className="threat-details">
                    <p><strong>TYPE:</strong> {verificationResult.data.threatType}</p>
                    <p><strong>REPORTER:</strong> {verificationResult.data.reporter}</p>
                    <p><strong>TIMESTAMP:</strong> {new Date(verificationResult.data.timestamp * 1000).toLocaleString()}</p>
                    <p><strong>STATUS:</strong> {verificationResult.data.verified ? 'Verified' : 'Unverified'}</p>
                    <p className="blockchain-confirmation">
                      <i className="fas fa-link"></i> {getNetworkName()}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Threat Analyst Chat Interface */}
      {showChat && (
        <div className="chat-container cyber-card">
          <div className="chat-messages">
            {conversation.length === 0 && (
              <div className="message assistant welcome-message">
                <strong>THREAT ANALYST:</strong> Welcome to BlockShield AI Threat Intelligence. Ask me about:
                <ul>
                  <li>Recent threat patterns</li>
                  <li>How to report new threats</li>
                  <li>Threat verification procedures</li>
                  <li>Blockchain security features</li>
                </ul>
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

      {/* System indicators */}
      <div className='system-indicators'>
        <span><i className='fas fa-network-wired'></i> {getNetworkName()}</span>
        <span><i className='fas fa-user-shield'></i> {account && !account.includes('Error') ? 'Authenticated' : 'Unauthenticated'}</span>
        <span><i className='fas fa-bell'></i> {threatStats.last24h} threats today</span>
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