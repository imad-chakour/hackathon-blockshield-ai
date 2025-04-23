# 🛡️ BlockShield AI - Blockchain-Powered Threat Intelligence Platform

A decentralized platform combining AI threat detection with Ethereum blockchain for immutable threat reporting and verification.

## 🔧 Technologies

### Core Stack
- **Frontend**: React.js with Cyberpunk UI
- **Backend**: FastAPI (Python 3.10+)
- **Blockchain**: Solidity (Ethereum) + Web3.py
- **Local Testing**: Ganache CLI

### AI Components
- **Threat Detection**: Gemini AI Model
- **URL Analysis**: Custom ML Models (.pkl files)
- **Conversational Interface**: Streamlit chatbot

### Monitoring
- **Metrics**: Prometheus + Custom metrics
- **Visualization**: Tableau Dashboards
- **Alerting**: Integrated blockchain events

## ✨ Key Features

### Decentralized Threat Verification
- Immutable threat hashes stored on Ethereum
- Smart contract-based verification system
- Transparent audit trail for all reports

### AI-Powered Analysis
- 98.7% accurate phishing/malware detection
- Real-time URL scanning
- Historical threat pattern recognition

### Real-Time Dashboards
- Interactive threat visualization
- Blockchain network monitoring
- AI model performance metrics

### Developer Ready
- Local Ganache development chain
- Dockerized monitoring stack
- Comprehensive API documentation

## 🛠️ Installation

### Prerequisites
- Python 3.10+
- Node.js 16+
- Ganache CLI (`npm install -g ganache`)
- Docker (for monitoring stack)

### Setup Instructions

```bash
# Clone repository
git clone https://github.com/imad-chakour/hackathon-blockshield-ai.git
cd hackathon-blockshield-ai

# Backend setup
cd app
pip install -r requirements.txt
python solcx.py install  # Install Solidity compiler

# Frontend setup
cd ../react-blockchain
npm install

# Launch development environment
npm start  # Frontend (localhost:3000)
python main.py  # Backend (localhost:8000)
🏗️ Project Structure
hackathon-blockshield-ai/
├── app/                      # Backend services
│   ├── AI/                   # Machine learning components
│   ├── contracts/            # Compiled smart contracts
│   └── monitoring/           # Prometheus configs
├── contracts/                # Solidity source
└── react-blockchain/         # Frontend application
🌐 Live Demo
Access our testnet deployment:
https://blockshield-ai-demo.vercel.app

📄 License
MIT License - See LICENSE for details.

📬 Contact
Team Lead: Imad Chakour
Email: chakourimad01@gmail.com
GitHub: imad-chakour
