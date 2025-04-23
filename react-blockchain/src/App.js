import React, { useState } from 'react';
import Navbar from './components/Navbar';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/pages/Home';
import About from './components/pages/About';
import HeroSection from './components/HeroSection';
import Footer from './components/Footer';

function App() {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  const handleScroll = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <Router>
      <div className="app-container">
        <Navbar
          onOpenAnalysis={() => setShowAnalysis(true)}
          onOpenVerification={() => setShowVerification(true)}
          onScrollToAbout={() => handleScroll('footer')}
          onScrollToHome={() => handleScroll('hero-section')}
        />

        <Routes>
          <Route 
            path='/' 
            element={
              <Home>
                <HeroSection 
                  id="hero-section"
                  showAnalysis={showAnalysis}
                  onCloseAnalysis={() => setShowAnalysis(false)}
                  showVerification={showVerification}
                  onCloseVerification={() => setShowVerification(false)}
                />
              </Home>
            } 
          />
          <Route path='/about' element={<About />} />
        </Routes>

        <Footer id="footer" />
      </div>
    </Router>
  );
}

export default App;