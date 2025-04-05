import React from 'react';
import ReactDOM from 'react-dom/client'; // Import createRoot
import App from './App';

// Create a root element for React
const root = ReactDOM.createRoot(document.getElementById('root'));

// Use root.render() to render the App component
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
