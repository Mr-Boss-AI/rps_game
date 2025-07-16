# Deployment Guide - Rock Paper Scissors GameFi Platform

## 🚀 Current Deployment Status

**Network**: Sui Devnet  
**Status**: ✅ Deployed and Operational  
**Date**: July 12, 2025  

## 📋 Deployment Information

### Smart Contract Deployment
- **Package ID**: `0x2d87063a9452573338e0545e86d6a0c4062bbe8fa606956f8315f3c56f1ba05d`
- **Treasury Cap ID**: `0xa1958abf65ec23cf3fe6a0298334173e788e9c30020d193aed6a0d236e932ab5`
- **Network**: Sui Devnet (`https://fullnode.devnet.sui.io:443`)
- **Framework Version**: sui-framework/devnet branch

### Frontend Deployment
- **URL**: http://localhost:3000
- **Framework**: Next.js 15.3.4
- **Status**: Running and connected to devnet

## 🛠 Prerequisites

### System Requirements
- **OS**: Linux (WSL2) or macOS
- **Node.js**: v18+ (LTS recommended)
- **Rust**: Latest stable version
- **Sui CLI**: Latest version

### Required Tools
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Node.js (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install --lts

# Install Sui CLI
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch devnet sui
```

## 📦 Smart Contract Deployment Process

### 1. Environment Setup
```bash
# Set up Sui environment
sui client new-env --alias devnet --rpc https://fullnode.devnet.sui.io:443
sui client switch --env devnet

# Generate deployment wallet (if needed)
sui client new-address ed25519
```

### 2. Contract Configuration
**File**: `/rps_game/Move.toml`
```toml
[package]
name = "rps_game"
version = "0.0.1"
published-at = "0x0"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/devnet" }

[addresses]
rps_game = "0x0"
```

### 3. Deployment Commands
```bash
# Build the package
cd /mnt/c/Users/shaka/Desktop/cloude-sui/rps_game
sui move build

# Deploy to devnet
sui client publish --gas-budget 100000000

# Note the Package ID and Treasury Cap ID from output
```

### 4. Post-Deployment Verification
```bash
# Verify package exists
sui client object <PACKAGE_ID>

# Check Treasury Cap
sui client object <TREASURY_CAP_ID>

# Mint test tokens
sui client call \
  --package <PACKAGE_ID> \
  --module rps_token \
  --function mint \
  --args <TREASURY_CAP_ID> 100000 <RECIPIENT_ADDRESS> \
  --gas-budget 10000000
```

## 🌐 Frontend Deployment Process

### 1. Frontend Setup
```bash
cd /mnt/c/Users/shaka/Desktop/cloude-sui/rps-frontend

# Install dependencies
npm install

# Configure environment
# Update CONTRACT addresses in src/app/page.tsx:
const PACKAGE_ID = "0x2d87063a9452573338e0545e86d6a0c4062bbe8fa606956f8315f3c56f1ba05d"
const TREASURY_CAP_ID = "0xa1958abf65ec23cf3fe6a0298334173e788e9c30020d193aed6a0d236e932ab5"
```

### 2. Network Configuration
**File**: `/rps-frontend/src/app/layout.tsx`
```typescript
<SuiClientProvider 
  networks={{
    devnet: { 
      url: 'https://fullnode.devnet.sui.io:443'
    }
  }}
  defaultNetwork="devnet"
  autoConnect={true}
>
```

### 3. Start Frontend
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## 🔧 Configuration Files

### Smart Contract Dependencies
**File**: `/rps_game/Move.toml`
- Uses `framework/devnet` branch for compatibility
- Package name: `rps_game`
- Modules: `rps_game`, `rps_token`

### Frontend Dependencies
**File**: `/rps-frontend/package.json`
```json
{
  "dependencies": {
    "@mysten/dapp-kit": "^0.16.13",
    "@mysten/sui.js": "^0.54.1",
    "@tanstack/react-query": "^5.81.5",
    "next": "15.3.4",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

## 🎯 Token Minting Process

### Mint Tokens to Test Wallets
```bash
# Mint 1000 RPS tokens (100000 units with 2 decimals)
sui client call \
  --package 0x2d87063a9452573338e0545e86d6a0c4062bbe8fa606956f8315f3c56f1ba05d \
  --module rps_token \
  --function mint \
  --args 0xa1958abf65ec23cf3fe6a0298334173e788e9c30020d193aed6a0d236e932ab5 100000 0x4b7a68b6293f08efa401feefb329be3c73956efd2a09caf98d6cdc2d13b9feec \
  --gas-budget 10000000

# Repeat for second wallet
sui client call \
  --package 0x2d87063a9452573338e0545e86d6a0c4062bbe8fa606956f8315f3c56f1ba05d \
  --module rps_token \
  --function mint \
  --args 0xa1958abf65ec23cf3fe6a0298334173e788e9c30020d193aed6a0d236e932ab5 100000 0x963d285d806c1c8970014b28d5b201d458ac40597f6a058ba6e03c96a7f99b31 \
  --gas-budget 10000000
```

## 🔍 Verification Steps

### 1. Smart Contract Verification
```bash
# Check if package is deployed
sui client objects --owner <DEPLOYER_ADDRESS>

# Verify token balance
sui client balance --address <WALLET_ADDRESS>

# Check specific coin type
sui client balance --address <WALLET_ADDRESS> --coin-type "<PACKAGE_ID>::rps_token::RPS_TOKEN"
```

### 2. Frontend Verification
1. Navigate to http://localhost:3000
2. Connect wallet (ZKLogin supported)
3. Verify balance displays correctly
4. Test challenge creation
5. Test challenge joining with second wallet
6. Verify automatic fund transfers

### 3. Transaction Verification
```bash
# Monitor recent transactions
sui client transactions --address <WALLET_ADDRESS>

# Check specific transaction
sui client transaction <TX_DIGEST>
```

## 🚨 Troubleshooting

### Common Issues and Solutions

#### ZKLogin Epoch Mismatch
**Error**: `ZKLogin max epoch too large`
**Solution**: 
1. Reset wallet extension or use different browser profile
2. Ensure system time is synchronized with NTP
3. Clear browser cache and wallet data

#### Contract Not Found
**Error**: Package ID not found on network
**Solution**:
1. Verify you're on correct network (devnet)
2. Check package ID matches deployment output
3. Redeploy if necessary

#### Frontend Connection Issues
**Error**: Cannot connect to Sui network
**Solution**:
1. Check network configuration in layout.tsx
2. Verify devnet RPC endpoint is accessible
3. Clear browser cache and restart frontend

#### Transaction Failures
**Error**: Insufficient gas or invalid signatures
**Solution**:
1. Ensure wallet has sufficient SUI for gas
2. Check package and function names are correct
3. Verify wallet permissions and signatures

## 📊 Monitoring and Maintenance

### Health Checks
```bash
# Check network status
curl -X POST https://fullnode.devnet.sui.io:443 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"suix_getLatestSuiSystemState","params":[]}'

# Monitor frontend
curl http://localhost:3000

# Check contract state
sui client object <PACKAGE_ID>
```

### Log Monitoring
- **Frontend logs**: `/rps-frontend/frontend.log`
- **Browser console**: Check for React/TypeScript errors
- **Network logs**: Monitor Sui devnet connectivity

## 🔄 Redeployment Process

### When to Redeploy
- Smart contract code changes
- Network migration
- Critical bug fixes
- Feature additions

### Redeployment Steps
1. Update Move.toml version
2. Build and test locally
3. Deploy with new Package ID
4. Update frontend configuration
5. Mint new test tokens
6. Verify all functionality

---

**Last Updated**: July 12, 2025  
**Next Review**: Monitor for devnet updates and framework changes