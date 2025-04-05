import React from 'react';
import './css/Footer.css';
import { Button } from './Button';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <div className='footer-container'>
      <section className='footer-subscription'>
        <p className='footer-subscription-heading'>
          Join Our Blockchain threat detection Network
        </p>
        <p className='footer-subscription-text'>
          Get updates on new features and security enhancements
        </p>
        <div className='input-areas'>
          <form>
            <input
              className='footer-input'
              name='email'
              type='email'
              placeholder='Your Email'
            />
            <Button buttonStyle='btn--outline'>Subscribe</Button>
          </form>
        </div>
      </section>
      <div className='footer-links'>
        <div className='footer-link-wrapper'>
          <div className='footer-link-items'>
            <h2>Technology</h2>
            <Link to='/'>How It Works</Link>
            <Link to='/'>Security</Link>
            <Link to='/'>Blockchain</Link>
            <Link to='/'>Smart Contracts</Link>
          </div>
          <div className='footer-link-items'>
            <h2>Resources</h2>
            <Link to='/'>Documentation</Link>
            <Link to='/'>API</Link>
            <Link to='/'>Whitepaper</Link>
            <Link to='/'>GitHub</Link>
          </div>
        </div>
        <div className='footer-link-wrapper'>
          <div className='footer-link-items'>
            <h2>Company</h2>
            <Link to='/'>About Us</Link>
            <Link to='/'>Careers</Link>
            <Link to='/'>Partners</Link>
            <Link to='/'>Contact</Link>
          </div>
          <div className='footer-link-items'>
            <h2>Legal</h2>
            <Link to='/'>Terms</Link>
            <Link to='/'>Privacy</Link>
            <Link to='/'>Compliance</Link>
            <Link to='/'>Cookies</Link>
          </div>
        </div>
      </div>
      <section className='social-media'>
        <div className='social-media-wrap'>
          <div className='footer-logo'>
            <Link to='/' className='social-logo'>
            BlockShield.AI
              <i className='fas fa-link' />
            </Link>
          </div>
          <small className='website-rights'>BlockShield.AI © {new Date().getFullYear()}</small>
          <div className='social-icons'>
            <Link
              className='social-icon-link github'
              to='https://github.com'
              target='_blank'
              aria-label='GitHub'
            >
              <i className='fab fa-github' />
            </Link>
            <Link
              className='social-icon-link twitter'
              to='https://twitter.com'
              target='_blank'
              aria-label='Twitter'
            >
              <i className='fab fa-twitter' />
            </Link>
            <Link
              className='social-icon-link discord'
              to='https://discord.com'
              target='_blank'
              aria-label='Discord'
            >
              <i className='fab fa-discord' />
            </Link>
            <Link
              className='social-icon-link telegram'
              to='https://telegram.org'
              target='_blank'
              aria-label='Telegram'
            >
              <i className='fab fa-telegram' />
            </Link>
            <Link
              className='social-icon-link linkedin'
              to='https://linkedin.com'
              target='_blank'
              aria-label='LinkedIn'
            >
              <i className='fab fa-linkedin' />
            </Link>
          </div>
        </div>
      </section>
      <div className="credits">
        <p>Blockchain Verification System powered by <span className="imad-credit">BlockShield.AI's technology</span></p>
      </div>
    </div>
    
  );
}

export default Footer;