# RPS Game Smart Contract Reference

## Contract Overview

**Package ID**: `0x55596a95eecb8c091a62c8c378d6d27941ed39f1ac75799e490d602df4e1534c`  
**Network**: Sui Devnet  
**Language**: Move  
**Published**: Block 42  
**Treasury Cap**: `0x9beb0ec1a6bbf1cef7493e657b4b1aa8f57a584fb59bf04766b7b193c0016fef`

## Modules

### 1. `rps_game::rps_token` - Token Module
Manages the RPS_TOKEN used for game stakes.

### 2. `rps_game::rps_game` - Game Logic Module
Handles challenge creation, joining, and resolution.

## Data Structures

### Challenge Struct
```move
struct Challenge has key, store {
    id: UID,
    creator: address,
    opponent: Option<address>,
    stake_amount: u64,
    creator_stake: Option<Coin<RPS_TOKEN>>,
    opponent_stake: Option<Coin<RPS_TOKEN>>,
    winner: Option<address>,
    is_completed: bool,
    created_at: u64,
}
```

**Fields**:
- `id`: Unique identifier for the challenge
- `creator`: Address of the challenge creator
- `opponent`: Address of the opponent (None if no one joined yet)
- `stake_amount`: Amount of tokens required to join (in token units)
- `creator_stake`: Escrowed tokens from creator
- `opponent_stake`: Escrowed tokens from opponent
- `winner`: Address of the winner (None until resolved)
- `is_completed`: Whether the challenge is finished
- `created_at`: Timestamp when challenge was created

## Events

### ChallengeCreated
```move
struct ChallengeCreated has copy, drop {
    challenge_id: ID,
    creator: address,
    stake_amount: u64,
}
```
Emitted when a new challenge is created.

### ChallengeJoined
```move
struct ChallengeJoined has copy, drop {
    challenge_id: ID,
    opponent: address,
}
```
Emitted when someone joins a challenge.

### ChallengeResolved
```move
struct ChallengeResolved has copy, drop {
    challenge_id: ID,
    winner: address,
}
```
Emitted when a challenge is resolved with a winner.

### TieResolved
```move
struct TieResolved has copy, drop {
    challenge_id: ID,
}
```
Emitted when a challenge ends in a tie.

### ChallengeCancelled
```move
struct ChallengeCancelled has copy, drop {
    challenge_id: ID,
    creator: address,
}
```
Emitted when a challenge is cancelled.

## Public Entry Functions

### 1. `create_challenge`
```move
public entry fun create_challenge(stake: Coin<RPS_TOKEN>, ctx: &mut TxContext)
```
**Purpose**: Create a new RPS challenge  
**Parameters**: 
- `stake`: RPS tokens to be escrowed as stake
- `ctx`: Transaction context

**Behavior**:
- Stakes tokens from creator in escrow
- Creates a shared Challenge object
- Emits ChallengeCreated event
- Returns challenge to global pool

**Requirements**: 
- Must have sufficient RPS tokens
- Stake amount must be > 0

### 2. `join_challenge`
```move
public entry fun join_challenge(challenge: &mut Challenge, opponent_stake: Coin<RPS_TOKEN>, ctx: &mut TxContext)
```
**Purpose**: Join an existing challenge  
**Parameters**:
- `challenge`: Mutable reference to challenge object
- `opponent_stake`: RPS tokens matching the required stake
- `ctx`: Transaction context

**Behavior**:
- Validates challenge is open and not completed
- Checks stake amount matches requirement
- Escrows opponent's stake
- Sets opponent address
- Emits ChallengeJoined event
- Challenge is now ready for off-chain game

**Requirements**:
- Challenge must not be completed
- Challenge must not already have an opponent
- Stake amount must exactly match required amount
- Cannot join your own challenge

### 3. `resolve_challenge`
```move
public entry fun resolve_challenge(challenge: &mut Challenge, ctx: &mut TxContext)
```
**Purpose**: Claim victory and receive combined stakes  
**Parameters**:
- `challenge`: Mutable reference to challenge object
- `ctx`: Transaction context

**Behavior**:
- Validates caller is one of the players
- Transfers both escrowed stakes to winner
- Marks challenge as completed
- Sets winner address
- Emits ChallengeResolved event

**Requirements**:
- Challenge must have an opponent (be joined)
- Challenge must not be completed
- Caller must be either creator or opponent
- Used after off-chain game determines winner

### 4. `resolve_tie`
```move
public entry fun resolve_tie(challenge: &mut Challenge, ctx: &mut TxContext)
```
**Purpose**: Handle tie games by returning stakes  
**Parameters**:
- `challenge`: Mutable reference to challenge object
- `ctx`: Transaction context

**Behavior**:
- Validates caller is one of the players
- Returns creator's stake to creator
- Returns opponent's stake to opponent
- Marks challenge as completed
- Emits TieResolved event

**Requirements**:
- Challenge must have an opponent (be joined)
- Challenge must not be completed
- Caller must be either creator or opponent

### 5. `cancel_challenge`
```move
public entry fun cancel_challenge(challenge: &mut Challenge, ctx: &mut TxContext)
```
**Purpose**: Cancel an unjoined challenge  
**Parameters**:
- `challenge`: Mutable reference to challenge object
- `ctx`: Transaction context

**Behavior**:
- Validates caller is the creator
- Returns escrowed stake to creator
- Marks challenge as completed
- Emits ChallengeCancelled event

**Requirements**:
- Caller must be the challenge creator
- Challenge must not be completed
- Challenge must not have an opponent

## Token Functions

### `mint_for_testing`
```move
public entry fun mint_for_testing(
    treasury: &mut TreasuryCap<RPS_TOKEN>,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext
)
```
**Purpose**: Mint RPS tokens for testing  
**Access**: Requires treasury capability  
**Parameters**:
- `treasury`: Treasury capability object
- `amount`: Number of token units to mint
- `recipient`: Address to receive tokens
- `ctx`: Transaction context

## Error Codes

- `E_CHALLENGE_COMPLETED = 0`: Challenge is already completed
- `E_CHALLENGE_ALREADY_JOINED = 1`: Challenge already has an opponent
- `E_NOT_CHALLENGE_CREATOR = 2`: Caller is not the challenge creator
- `E_INVALID_STAKE_AMOUNT = 3`: Stake amount doesn't match requirement
- `E_NOT_A_PLAYER = 5`: Caller is not a participant in this challenge

## Game Flow

### 1. Challenge Creation
1. Player A calls `create_challenge` with stake
2. Tokens are escrowed in contract
3. Challenge object created and shared
4. ChallengeCreated event emitted

### 2. Challenge Joining
1. Player B finds open challenge
2. Player B calls `join_challenge` with matching stake
3. Both stakes now escrowed
4. ChallengeJoined event emitted
5. Challenge ready for off-chain game

### 3. Game Resolution
**Winner Scenario**:
1. Players play Rock Paper Scissors off-chain
2. Winner calls `resolve_challenge`
3. Winner receives both stakes
4. ChallengeResolved event emitted

**Tie Scenario**:
1. Players play and tie
2. Either player calls `resolve_tie`
3. Both players get their original stakes back
4. TieResolved event emitted

### 4. Challenge Cancellation
1. Creator can call `cancel_challenge` before anyone joins
2. Creator gets their stake back
3. ChallengeCancelled event emitted

## Security Features

- **Escrow System**: Stakes are held in contract until resolution
- **Access Control**: Only participants can resolve challenges
- **State Validation**: Prevents double-spending and invalid state transitions
- **Event Logging**: All actions are logged for transparency
- **Immutable Logic**: Contract code cannot be changed after deployment

## Technical Notes

- **Token Decimals**: 2 (1.00 RPS = 100 units)
- **Storage**: Challenge objects are shared objects
- **Gas Optimization**: Uses efficient Move patterns
- **Upgrade Path**: Package is immutable, new versions require new deployment

## Integration Examples

### Creating a Challenge (TypeScript)
```typescript
const tx = new Transaction();
tx.moveCall({
  target: `${PACKAGE_ID}::rps_game::create_challenge`,
  arguments: [stakeCoin]
});
```

### Joining a Challenge (TypeScript)
```typescript
const tx = new Transaction();
tx.moveCall({
  target: `${PACKAGE_ID}::rps_game::join_challenge`,
  arguments: [
    tx.object(challengeId),
    stakeCoin
  ]
});
```

### Resolving as Winner (TypeScript)
```typescript
const tx = new Transaction();
tx.moveCall({
  target: `${PACKAGE_ID}::rps_game::resolve_challenge`,
  arguments: [tx.object(challengeId)]
});
```

## Current Deployment Status

✅ **Active**: Contract is live and functional  
✅ **Tested**: All functions working as expected  
✅ **Frontend**: Integrated with working UI  
✅ **Tokens**: Successfully minted and distributed  
✅ **Game Flow**: Challenge creation and joining verified