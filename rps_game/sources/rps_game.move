module rps_game::rps_game {
    use sui::object::{Self, UID};
    use sui::coin::{TreasuryCap, Coin, mint, join, value};
    use sui::transfer::{public_transfer, share_object};
    use sui::tx_context::{TxContext, sender, epoch_timestamp_ms};
    use sui::event;
    use std::option::{Option, none, some, is_some};
    use rps_game::rps_token::RPS_TOKEN;

    /// On-chain challenge object with proper fund escrow
    struct Challenge has key, store {
        id: UID,
        creator: address,
        stake_amount: u64,
        opponent: Option<address>,
        created_at: u64,
        is_completed: bool,
        // Prize pool - holds creator's stake until someone joins
        creator_stake: Option<Coin<RPS_TOKEN>>,
        // Winner of the challenge (joiner wins automatically)
        winner: Option<address>,
    }

    /// Event emitted when a challenge is created
    struct ChallengeCreated has copy, drop {
        challenge_id: address,
        creator: address,
        stake_amount: u64,
        created_at: u64,
    }

    /// Event emitted when a challenge is joined (and completed)
    struct ChallengeJoined has copy, drop {
        challenge_id: address,
        creator: address,
        joiner: address,
        stake_amount: u64,
        total_prize: u64,
        winner: address,
    }

    /// Event emitted when a challenge is cancelled
    struct ChallengeCancelled has copy, drop {
        challenge_id: address,
        creator: address,
        stake_amount: u64,
        cancelled_at: u64,
    }

    /// Error codes
    const E_CHALLENGE_ALREADY_JOINED: u64 = 1;
    const E_CANNOT_JOIN_OWN_CHALLENGE: u64 = 2;
    const E_CHALLENGE_COMPLETED: u64 = 3;
    const E_INSUFFICIENT_STAKE: u64 = 4;
    const E_NOT_CHALLENGE_CREATOR: u64 = 5;

    /// Create a new challenge with proper fund escrow
    public entry fun create_challenge(
        stake: Coin<RPS_TOKEN>,
        ctx: &mut TxContext
    ) {
        let stake_amount = value(&stake);
        let now = epoch_timestamp_ms(ctx);
        let creator = sender(ctx);
        
        let challenge = Challenge {
            id: object::new(ctx),
            creator,
            stake_amount,
            opponent: none<address>(),
            created_at: now,
            is_completed: false,
            // Hold creator's stake in escrow
            creator_stake: some(stake),
            winner: none<address>(),
        };
        
        // Emit event
        event::emit(ChallengeCreated {
            challenge_id: object::uid_to_address(&challenge.id),
            creator,
            stake_amount,
            created_at: now,
        });
        
        share_object(challenge);
    }

    /// Join challenge and WIN! (First to join wins mechanism)
    public entry fun join_challenge(
        challenge: &mut Challenge,
        joiner_stake: Coin<RPS_TOKEN>,
        ctx: &mut TxContext
    ) {
        let joiner = sender(ctx);
        
        // Validation checks
        assert!(!challenge.is_completed, E_CHALLENGE_COMPLETED);
        assert!(!is_some(&challenge.opponent), E_CHALLENGE_ALREADY_JOINED);
        assert!(challenge.creator != joiner, E_CANNOT_JOIN_OWN_CHALLENGE);
        assert!(value(&joiner_stake) >= challenge.stake_amount, E_INSUFFICIENT_STAKE);
        
        // Extract creator's stake from escrow
        let creator_coin = std::option::extract(&mut challenge.creator_stake);
        
        // Calculate total prize
        let creator_amount = value(&creator_coin);
        let joiner_amount = value(&joiner_stake);
        let total_prize = creator_amount + joiner_amount;
        
        // Combine stakes - joiner wins everything
        join(&mut creator_coin, joiner_stake);
        
        // JOINER WINS: Transfer all funds to joiner
        public_transfer(creator_coin, joiner);
        
        // Update challenge state
        challenge.opponent = some(joiner);
        challenge.is_completed = true;
        challenge.winner = some(joiner);
        
        // Emit event
        event::emit(ChallengeJoined {
            challenge_id: object::uid_to_address(&challenge.id),
            creator: challenge.creator,
            joiner,
            stake_amount: challenge.stake_amount,
            total_prize,
            winner: joiner,
        });
    }

    /// Cancel challenge and return escrowed funds to creator
    public entry fun cancel_challenge(
        challenge: &mut Challenge,
        ctx: &mut TxContext
    ) {
        let caller = sender(ctx);
        let now = epoch_timestamp_ms(ctx);
        
        // Security checks
        assert!(challenge.creator == caller, E_NOT_CHALLENGE_CREATOR);
        assert!(!challenge.is_completed, E_CHALLENGE_COMPLETED);
        assert!(!is_some(&challenge.opponent), E_CHALLENGE_ALREADY_JOINED);
        
        // Extract creator's stake from escrow
        let creator_stake = std::option::extract(&mut challenge.creator_stake);
        
        // Return funds to creator
        public_transfer(creator_stake, challenge.creator);
        
        // Mark challenge as completed to prevent further interactions
        challenge.is_completed = true;
        
        // Emit cancellation event
        event::emit(ChallengeCancelled {
            challenge_id: object::uid_to_address(&challenge.id),
            creator: challenge.creator,
            stake_amount: challenge.stake_amount,
            cancelled_at: now,
        });
    }

    /// Get challenge info
    public fun get_challenge_info(challenge: &Challenge): (address, u64, Option<address>, bool, u64) {
        (
            challenge.creator,
            challenge.stake_amount,
            challenge.opponent,
            challenge.is_completed,
            challenge.created_at
        )
    }

    /// Get winner info
    public fun get_winner(challenge: &Challenge): Option<address> {
        challenge.winner
    }

    /// Mint tokens for testing
    public entry fun mint_and_send(
        treasury: &mut TreasuryCap<RPS_TOKEN>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let c = mint(treasury, amount, ctx);
        public_transfer(c, recipient);
    }
}