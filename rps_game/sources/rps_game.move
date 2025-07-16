/// Rock Paper Scissors Game Smart Contract
module rps_game::rps_game {
    use sui::coin::{Self, Coin};
    use sui::object::{Self, ID, UID};
    use sui::event;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::option::{Self, Option};

    // Import the token module
    use rps_game::rps_token::RPS_TOKEN;

    // ========= Errors =========
    const E_CHALLENGE_COMPLETED: u64 = 0;
    const E_CHALLENGE_ALREADY_JOINED: u64 = 1;
    const E_NOT_CHALLENGE_CREATOR: u64 = 2;
    const E_INVALID_STAKE_AMOUNT: u64 = 3;
    const E_NOT_A_PLAYER: u64 = 5;

    // ========= Structs =========
    struct Challenge has key, store {
        id: UID,
        creator: address,
        opponent: Option<address>,
        stake_amount: u64,
        creator_stake: Option<Coin<RPS_TOKEN>>,
        opponent_stake: Option<Coin<RPS_TOKEN>>, // Added field for opponent's stake
        winner: Option<address>,
        is_completed: bool,
        created_at: u64,
    }

    // ========= Events =========
    struct ChallengeCreated has copy, drop {
        challenge_id: ID,
        creator: address,
        stake_amount: u64,
    }

    struct ChallengeJoined has copy, drop {
        challenge_id: ID,
        opponent: address,
    }

    struct ChallengeResolved has copy, drop {
        challenge_id: ID,
        winner: address,
    }

    struct ChallengeCancelled has copy, drop {
        challenge_id: ID,
        creator: address,
    }

    struct TieResolved has copy, drop {
        challenge_id: ID,
    }


    // ========= Public-Entry Functions =========

    /// Create a new challenge by staking RPS_TOKEN
    public entry fun create_challenge(stake: Coin<RPS_TOKEN>, ctx: &mut TxContext) {
        let stake_amount = coin::value(&stake);
        let challenge = Challenge {
            id: object::new(ctx),
            creator: tx_context::sender(ctx),
            opponent: option::none(),
            stake_amount,
            creator_stake: option::some(stake),
            opponent_stake: option::none(),
            winner: option::none(),
            is_completed: false,
            created_at: tx_context::epoch(ctx),
        };

        event::emit(ChallengeCreated {
            challenge_id: object::id(&challenge),
            creator: challenge.creator,
            stake_amount,
        });

        transfer::share_object(challenge);
    }

    /// Join an existing challenge. No longer pays out instantly.
    public entry fun join_challenge(challenge: &mut Challenge, opponent_stake: Coin<RPS_TOKEN>, ctx: &mut TxContext) {
        assert!(!challenge.is_completed, E_CHALLENGE_COMPLETED);
        assert!(!option::is_some(&challenge.opponent), E_CHALLENGE_ALREADY_JOINED);
        assert!(coin::value(&opponent_stake) == challenge.stake_amount, E_INVALID_STAKE_AMOUNT);

        challenge.opponent = option::some(tx_context::sender(ctx));
        option::fill(&mut challenge.opponent_stake, opponent_stake);

        event::emit(ChallengeJoined {
            challenge_id: object::id(challenge),
            opponent: tx_context::sender(ctx),
        });
    }
    
    /// Called by the winner to claim the combined stakes after the off-chain game is over.
    public entry fun resolve_challenge(challenge: &mut Challenge, ctx: &mut TxContext) {
        let winner_address = tx_context::sender(ctx);
        assert!(!challenge.is_completed, E_CHALLENGE_COMPLETED);

        // Ensure the caller is one of the players
        let creator = challenge.creator;
        let opponent = option::destroy_some(challenge.opponent);
        assert!(winner_address == creator || winner_address == opponent, E_NOT_A_PLAYER);

        // Transfer funds to the winner
        let creator_stake = option::extract(&mut challenge.creator_stake);
        let opponent_stake = option::extract(&mut challenge.opponent_stake);
        
        coin::join(&mut creator_stake, opponent_stake);
        transfer::public_transfer(creator_stake, winner_address);

        challenge.winner = option::some(winner_address);
        challenge.is_completed = true;

        event::emit(ChallengeResolved {
            challenge_id: object::id(challenge),
            winner: winner_address,
        });
    }
    
    /// In case of a tie, both players get their stake back.
    public entry fun resolve_tie(challenge: &mut Challenge, ctx: &mut TxContext) {
        let caller = tx_context::sender(ctx);
        assert!(!challenge.is_completed, E_CHALLENGE_COMPLETED);
        
        let creator = challenge.creator;
        let opponent = option::destroy_some(challenge.opponent);
        assert!(caller == creator || caller == opponent, E_NOT_A_PLAYER);
        
        // Return funds to original owners
        let creator_stake = option::extract(&mut challenge.creator_stake);
        let opponent_stake = option::extract(&mut challenge.opponent_stake);
        
        transfer::public_transfer(creator_stake, creator);
        transfer::public_transfer(opponent_stake, opponent);
        
        challenge.is_completed = true;
        
        event::emit(TieResolved {
            challenge_id: object::id(challenge),
        });
    }

    /// Allows the creator to cancel a challenge if it hasn't been joined yet.
    public entry fun cancel_challenge(challenge: &mut Challenge, ctx: &mut TxContext) {
        let caller = tx_context::sender(ctx);
        assert!(challenge.creator == caller, E_NOT_CHALLENGE_CREATOR);
        assert!(!challenge.is_completed, E_CHALLENGE_COMPLETED);
        assert!(!option::is_some(&challenge.opponent), E_CHALLENGE_ALREADY_JOINED);

        let creator_stake = option::extract(&mut challenge.creator_stake);
        transfer::public_transfer(creator_stake, challenge.creator);

        challenge.is_completed = true;

        event::emit(ChallengeCancelled {
            challenge_id: object::id(challenge),
            creator: challenge.creator,
        });
    }
}