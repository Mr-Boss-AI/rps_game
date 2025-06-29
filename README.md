# Rock Paper Scissors Blockchain Game

A full-stack blockchain-based Rock Paper Scissors game built on Sui Network with Move smart contracts, Next.js frontend, and FastAPI backend.

## 🎯 Current Status

**✅ FULLY FUNCTIONAL PROTOTYPE READY FOR GAMEPLAY TESTING**

- **Smart Contracts**: Deployed and working on Sui Devnet
- **Frontend**: Connected and functional with wallet integration
- **Backend**: API running and ready for WebSocket implementation
- **RPS Tokens**: Minted and distributed to test wallets
- **Challenge System**: Create/join challenges working across wallets

## 🏗️ Architecture

```
/rps_game/          # Move smart contracts (Sui Devnet)
/rps-frontend/      # Next.js React frontend
/rps-backend/       # FastAPI Python backend
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+ and pip
- Sui CLI installed and configured for devnet

### 1. Smart Contracts
```bash
cd rps_game
sui move build
sui client publish --gas-budget 100000000
```

### 2. Frontend
```bash
cd rps-frontend
npm install
npm run dev
# Open http://localhost:3000
```

### 3. Backend
```bash
cd rps-backend
pip install -r requirements.txt
uvicorn main:app --reload
# API runs on http://localhost:8000
```

## 🎮 How to Play

1. **Connect Wallet**: Use Sui wallet (Sui Wallet, Suiet, etc.)
2. **Get RPS Tokens**: Mint test tokens using the smart contract
3. **Create Challenge**: Stake RPS tokens to create a challenge
4. **Join Challenge**: Other players can join with matching stake
5. **Play Game**: Rock/Paper/Scissors battle system (coming next)

## 🔧 Configuration

### Network
- **Network**: Sui Devnet
- **RPC URL**: https://fullnode.devnet.sui.io:443

### Environment Setup
- Frontend: Configured for devnet
- Backend: CORS enabled for localhost:3000
- Smart Contracts: Deployed to devnet

## 📁 Project Structure

```
sui/
├── rps_game/                 # Move smart contracts
│   ├── sources/
│   │   ├── rps_token.move    # Custom RPS token
│   │   └── rps_game.move     # Game logic & challenges
│   ├── tests/
│   └── Move.toml
├── rps-frontend/             # Next.js frontend
│   ├── src/app/
│   │   ├── page.tsx          # Main game interface
│   │   ├── layout.tsx        # Wallet providers
│   │   └── globals.css       # Styling
│   ├── public/
│   └── package.json
├── rps-backend/              # FastAPI backend
│   ├── main.py               # API server
│   └── requirements.txt      # Python dependencies
├── PROJECT_STATUS.md         # Detailed project status
└── README.md                 # This file
```

## 🔒 Security Notes

- **Sensitive Information**: Deployment details (Package IDs, Treasury Cap IDs, wallet addresses) are kept in `DEPLOYMENT_INFO.md`
- **Git Security**: `DEPLOYMENT_INFO.md` is excluded from Git via `.gitignore`
- **Public Repository**: Only template/placeholder values are committed

## 🛠️ Development

### Frontend Tech Stack
- Next.js 15 + React 19 + TypeScript
- Tailwind CSS v4
- @mysten/dapp-kit for Sui wallet integration
- @mysten/sui.js for blockchain interaction

### Backend Tech Stack
- FastAPI (Python)
- WebSocket support (planned)
- CORS enabled for frontend

### Smart Contracts
- Move language
- Sui blockchain
- Custom RPS token implementation

## 📋 Current Features

### ✅ Implemented
- Sui wallet connection
- RPS token minting and balance display
- Challenge creation with stake input
- Global challenge lobby
- Challenge joining functionality
- Cross-wallet challenge discovery
- Real-time balance updates
- Backend API with health checks

### 🚧 Coming Next
- Rock/Paper/Scissors battle interface
- Real-time WebSocket game server
- HP system and round tracking
- Match settlement and token distribution
- Player statistics and leaderboards

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Support

For issues and questions:
- Check the `PROJECT_STATUS.md` for detailed technical information
- Review the Move smart contract code in `/rps_game/sources/`
- Examine the frontend implementation in `/rps-frontend/src/`

## 🔄 Deployment Info

**Note**: Sensitive deployment information (Package IDs, Treasury Cap IDs, wallet addresses) is kept locally in `DEPLOYMENT_INFO.md` and is not committed to this public repository for security reasons.

For local development and testing, refer to the `DEPLOYMENT_INFO.md` file in your local workspace. 