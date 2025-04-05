import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Link, useLocation } from 'react-router-dom';
import './css/Navbar.css';

function Navbar() {
  const [click, setClick] = useState(false);
  const [button, setButton] = useState(true);
  const location = useLocation();

  const handleClick = () => setClick(!click);
  const closeMobileMenu = () => setClick(false);

  const showButton = () => {
    setButton(window.innerWidth > 960);
  };

  useEffect(() => {
    showButton();
    window.addEventListener('resize', showButton);
    return () => window.removeEventListener('resize', showButton);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className='navbar'>
      <div className='navbar-container'>
        <Link to='/' className='navbar-logo' onClick={closeMobileMenu}>
        BlockShield.AI <i className="fas fa-link"></i>
        </Link>
        
        <div className='menu-icon' onClick={handleClick}>
          <i className={click ? 'fas fa-times' : 'fas fa-bars'} />
        </div>
        
        <ul className={click ? 'nav-menu active' : 'nav-menu'}>
          <li className='nav-item'>
            <Link 
              to='/' 
              className={`nav-links ${isActive('/') ? 'active' : ''}`} 
              onClick={closeMobileMenu}
            >
              Home
            </Link>
          </li>
          
          <li className='nav-item'>
            <Link
              to='/Upload'
              className={`nav-links ${isActive('/Upload') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              reportThreat
            </Link>
          </li>
          
          <li className='nav-item'>
            <Link
              to='/Verify'
              className={`nav-links ${isActive('/Verify') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              verifyThreat
            </Link>
          </li>
          
          <li className='nav-item'>
            <Link
              to='/About'
              className={`nav-links ${isActive('/About') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              About
            </Link>
          </li>
          
          <li className='nav-item'>
            <Link
              to='/sign-up'
              className='nav-links-mobile'
              onClick={closeMobileMenu}
            >
              Sign Up
            </Link>
          </li>
        </ul>
        
        {button && (
          <Button 
            buttonStyle='btn--outline' 
            buttonSize='btn--medium'
            to='/sign-up'
          >
            Sign up
            <i className="fas fa-user-lock"></i> 
            
          </Button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;