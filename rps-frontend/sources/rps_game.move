module rps_game::rps_game {
    use sui::object::{Self, UID};
    use sui::coin::{TreasuryCap, Coin, mint, join};
    use sui::transfer::{public_transfer, transfer};
    use sui::tx_context::{TxContext, sender, epoch_timestamp_ms};
    use std::option::{Option, none, some};
    use rps_game::rps_token::RpsToken;

    /// On-chain challenge object, with timestamp
    struct Challenge has key, store, drop {
        id: UID,
        stake: Coin<RpsToken>,
        opponent: Option<address>,
        created_at: u64,
    }

    /// Create a new challenge and transfer it to sender
    public entry fun create_challenge(
        treasury: &mut TreasuryCap<RpsToken>,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let token = mint(treasury, amount, ctx);
        let now = epoch_timestamp_ms(ctx);
        let challenge = Challenge {
            id: object::new(ctx),
            stake: token,
            opponent: none<address>(),
            created_at: now,
        };
        transfer(challenge, sender(ctx));
    }

    /// Join an existing challenge by topping up the stake
    public entry fun join_challenge(
        challenge: Challenge,
        stake: Coin<RpsToken>,
        ctx: &mut TxContext
    ) {
        // Destructure the challenge
        let Challenge { id, stake: existing_stake, opponent: _, created_at } = challenge;
        
        // Delete the old UID
        object::delete(id);
        
        // Join the stakes - existing_stake is already mutable when moved out
        join(&mut existing_stake, stake);
        
        // Create new challenge with new UID
        let updated_challenge = Challenge {
            id: object::new(ctx),
            stake: existing_stake,
            opponent: some(sender(ctx)),
            created_at,
        };
        
        transfer(updated_challenge, sender(ctx));
    }

    /// Mint tokens and immediately send them
    public entry fun mint_and_send(
        treasury: &mut TreasuryCap<RpsToken>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let c = mint(treasury, amount, ctx);
        public_transfer(c, recipient);
    }
}