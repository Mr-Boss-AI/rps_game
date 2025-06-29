# Rock Paper Scissors Blockchain Game - Project Status

## Project Overview
A full-stack blockchain-based Rock Paper Scissors game built on Sui Network with:
- Move smart contracts for on-chain game logic
- Next.js frontend with Sui wallet integration
- Planned Python FastAPI backend for real-time gameplay
- Custom RPS token for staking and rewards

## Current Implementation Status ✅

### Smart Contracts (COMPLETED)
**Location**: `/rps_game/sources/`
- **rps_token.move**: Custom RPS_TOKEN with proper coin initialization
- **rps_game.move**: Challenge creation and joining system
- **Package ID**: `0x997e53c07355247d6debd7d11272d63428d564cc1c2cfe4674b0199047bf1672`
- **Treasury Cap ID**: `0x2c5b6c528561c0dd8f0512ef01a3f1b68b65a5cdc448d9b70a3b0485e43481b1`

**Implemented Functions**:
- `create_challenge(treasury, amount, ctx)` - Creates staked challenge
- `join_challenge(challenge, stake, ctx)` - Join existing challenge
- `mint_for_testing()` - Test token minting

### Frontend (PARTIALLY COMPLETED)
**Location**: `/rps-frontend/src/`
- **Framework**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS v4
- **Wallet Integration**: @mysten/dapp-kit

**Working Features**:
- Sui wallet connection (ConnectButton)
- RPS token balance display
- Challenge creation with stake input
- Global challenge lobby showing all challenges
- Challenge joining functionality
- Real-time balance updates

**Current UI Sections**:
1. Wallet connection status
2. Token balance display  
3. Challenge lobby with join/create options
4. Challenge creation form

### Dependencies
```json
{
  "@mysten/dapp-kit": "^0.16.13",
  "@mysten/sui.js": "^0.54.1", 
  "@tanstack/react-query": "^5.81.5",
  "next": "15.3.4",
  "react": "^19.0.0"
}
```

## What's Missing (TO-DO) ❌

### 1. Actual Game Battle System
**Priority**: HIGH
- Rock/Paper/Scissors move submission UI
- Real-time battle interface during matches
- HP display (each player starts with 3 HP)
- Round-by-round progress tracking
- Victory/defeat screens

### 2. Backend Game Server  
**Priority**: HIGH
**Tech Stack**: Python + FastAPI + WebSockets
**Purpose**: 
- Handle real-time R/P/S move coordination
- Validate moves and determine round winners
- Manage HP decrementation  
- Coordinate final match settlement
- Prevent cheating via simultaneous move revelation

### 3. Enhanced Smart Contracts
**Priority**: MEDIUM
- `finish_challenge()` function for final settlement
- Oracle signature verification for match results
- Proper winner determination and token transfer
- Challenge cleanup and state management

### 4. HP & Cooldown System
**Priority**: MEDIUM  
- Track player HP across matches
- Implement HP regeneration (1 HP per 10 minutes)
- Cooldown periods between matches
- Pre-match HP requirement validation

### 5. Advanced Features
**Priority**: LOW
- Match history tracking
- Player statistics and leaderboards
- Tournament system
- Enhanced UI/UX with animations

## Technical Architecture

### Current Flow:
1. User connects Sui wallet
2. User creates challenge with RPS token stake
3. Challenge appears in global lobby
4. Another user joins challenge with matching stake
5. **[MISSING]** Actual R/P/S battle occurs
6. **[MISSING]** Winner determined and tokens distributed

### Planned Full Flow:
1. User connects wallet ✅
2. User creates/joins challenge ✅
3. **[TO-DO]** Real-time WebSocket connection to game server
4. **[TO-DO]** Players submit R/P/S moves simultaneously  
5. **[TO-DO]** Server determines round winner, updates HP
6. **[TO-DO]** Repeat until one player reaches 0 HP
7. **[TO-DO]** Server signs match result and triggers on-chain settlement

## File Structure
```
/rps_game/                 # Move smart contracts
  sources/
    rps_token.move         # Token implementation ✅
    rps_game.move          # Challenge system ✅
    
/rps-frontend/             # Next.js frontend  
  src/app/
    page.tsx               # Main game interface ✅
    layout.tsx             # Wallet providers ✅
    globals.css            # Styling ✅
```

## Next Immediate Steps

### Step 1: Complete Battle Interface (Frontend)
- Add R/P/S button selection UI
- Create battle screen component  
- Add HP bars and round counter
- Handle move submission state

### Step 2: Implement Game Server (Backend)
- Set up FastAPI project structure
- Implement WebSocket endpoints for real-time communication
- Add game room management
- Create move validation and round resolution logic

### Step 3: Connect Frontend to Backend
- WebSocket client integration
- Real-time game state updates
- Move submission and result handling

### Step 4: Final Settlement (Smart Contracts)
- Add finish_challenge function
- Implement server signature verification
- Complete token distribution logic

## Commands to Run Project

### Smart Contracts:
```bash
cd rps_game
sui move build
sui client publish --gas-budget 100000000
```

### Frontend:
```bash  
cd rps-frontend
npm install
npm run dev  # Runs on http://localhost:3000
```

## Key Configuration
- **Network**: Sui Testnet
- **RPC URL**: https://fullnode.testnet.sui.io:443
- **Package Published**: ✅ (see Package ID above)
- **Frontend Environment**: Local development ready

## Notes for AI Continuation
- User wants to continue building features incrementally
- Smart contracts are deployed and working on testnet
- Frontend successfully connects to Sui and can create/join challenges
- Main gap is the actual gameplay mechanics (R/P/S battles)
- Backend server is completely missing but planned
- User prefers to maintain this status document for continuity across AI sessions

## Current Blocker
The game can create and join challenges but lacks the core R/P/S battle implementation. Players can stake tokens and enter the lobby but cannot actually play the game yet.