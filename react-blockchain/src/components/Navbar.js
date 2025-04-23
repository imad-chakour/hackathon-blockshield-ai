import React, { useState, useEffect } from 'react';
import { checkBlockchainConnection } from './services/api';
import './css/Navbar.css';

function Navbar({ 
  onOpenAnalysis, 
  onOpenVerification, 
  onScrollToAbout,
  onScrollToHome
}) {
  const [click, setClick] = useState(false);
  const [button, setButton] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    status: "checking",
    timestamp: null,
    error: null
  });

  const handleClick = () => setClick(!click);
  const closeMobileMenu = () => setClick(false);

  const showButton = () => {
    setButton(window.innerWidth > 960);
  };

  useEffect(() => {
    showButton();
    window.addEventListener('resize', showButton);
    
    const checkStatus = async () => {
      try {
        const status = await checkBlockchainConnection();
        setConnectionStatus({
          connected: status.connected,
          status: status.connected ? "connected" : "disconnected",
          timestamp: status.timestamp,
          error: null
        });
      } catch (error) {
        console.error('Connection check failed:', error);
        setConnectionStatus({
          connected: false,
          status: "error",
          timestamp: new Date().toISOString(),
          error: error.message || "Connection check failed"
        });
      }
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 15000); // Check every 15 seconds
    
    return () => {
      window.removeEventListener('resize', showButton);
      clearInterval(interval);
    };
  }, []);

  const handleDefendClick = (e) => {
    e.preventDefault();
    closeMobileMenu();
    if (onOpenAnalysis) onOpenAnalysis();
  };

  const handleVerifyClick = (e) => {
    e.preventDefault();
    closeMobileMenu();
    if (onOpenVerification) onOpenVerification();
  };

  const handleAboutClick = (e) => {
    e.preventDefault();
    closeMobileMenu();
    if (onScrollToAbout) onScrollToAbout();
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    closeMobileMenu();
    if (onScrollToHome) onScrollToHome();
  };

  const getStatusIndicator = () => {
    switch(connectionStatus.status) {
      case 'connected':
        return (
          <>
            <i className="fas fa-link connected-icon" />
            <span className="status-text">Connected</span>
            <span className="pulse-dot"></span>
          </>
        );
      case 'error':
        return (
          <>
            <i className="fas fa-unlink error-icon" />
            <span className="status-text">Error</span>
          </>
        );
      default: // checking or disconnected
        return (
          <>
            <i className="fas fa-unlink disconnected-icon" />
            <span className="status-text">Disconnected</span>
          </>
        );
    }
  };

  return (
    <nav className='navbar'>
      <div className='navbar-container'>
        <a href='#' className='navbar-logo' onClick={handleHomeClick}>
          BlockShield.AI
          <span className={`connection-indicator ${connectionStatus.status}`}>
            {getStatusIndicator()}
          </span>
        </a>
        
        <div className='menu-icon' onClick={handleClick}>
          <i className={click ? 'fas fa-times' : 'fas fa-bars'} />
        </div>
        
        <ul className={click ? 'nav-menu active' : 'nav-menu'}>
          <li className='nav-item'>
            <a href='#' className='nav-links' onClick={handleHomeClick}>
              Home
            </a>
          </li>
          
          <li className='nav-item'>
            <a href='#' className='nav-links' onClick={handleDefendClick}>
              Defend with AI
            </a>
          </li>
          
          <li className='nav-item'>
            <a href='#' className='nav-links' onClick={handleVerifyClick}>
              Verify Threat
            </a>
          </li>
          
          <li className='nav-item'>
            <a href='#' className='nav-links' onClick={handleAboutClick}>
              About
            </a>
          </li>
          
          <li className='nav-item blockchain-status-mobile'>
            <div className={`connection-status ${connectionStatus.status}`}>
              {connectionStatus.status === 'connected' ? (
                <>
                  <span>API Online</span>
                  <span className="pulse-dot"></span>
                </>
              ) : (
                `API ${connectionStatus.status}`
              )}
              {connectionStatus.error && (
                <div className="error-tooltip">{connectionStatus.error}</div>
              )}
            </div>
          </li>
        </ul>
        
        <div className={`blockchain-status-desktop ${connectionStatus.status}`}>
          {connectionStatus.status === 'connected' ? (
            <>
              <i className="fas fa-server" />
              <span>Service Online</span>
              {connectionStatus.timestamp && (
                <span className="timestamp">
                  Last check: {new Date(connectionStatus.timestamp).toLocaleTimeString()}
                </span>
              )}
              <span className="pulse-dot"></span>
            </>
          ) : (
            <>
              <i className="fas fa-server" />
              <span>Service {connectionStatus.status}</span>
              {connectionStatus.error && (
                <div className="error-tooltip">{connectionStatus.error}</div>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;